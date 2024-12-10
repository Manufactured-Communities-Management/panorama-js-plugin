#!/usr/bin/env python3

import os
import math
import pathlib
import subprocess
import tempfile
import json
import numpy as np
from scipy.ndimage import binary_erosion
from PIL import Image
from os.path import join
from io import IOBase
from psutil import virtual_memory
import hashlib


# Function to resize an image, with antialiasing
def resize_image(image: Image, width: float, height: float, resample=Image.Resampling.LANCZOS):
    return image.resize([width, height], resample)


# Function to save an image in the given format
def save_image(image: Image, fp: str | IOBase, format: str | None = None, quality: float = 100, **params):
    params.setdefault('subsampling', 0)
    params.setdefault('progressive', False)
    params.setdefault('optimize', True)

    if type(fp) == str:
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        pathlib.Path(fp).unlink(missing_ok=True)

    if (format is None) and (type(fp) == str):
        format = str(pathlib.Path(fp).suffix[1:]).upper()

    format_upper = str(format).upper()
    if format_upper in {'TIF', 'TIFF'}:
        image.save(fp, format='TIFF', subsampling=0, progressive=False, optimize=False)
        return
    if format_upper in {'BMP'}:
        image.save(fp, format='BMP', subsampling=0, progressive=False, optimize=False)
        return
    if (format is None) or (format_upper not in {'BASIS', 'KTX2'}):
        image.save(fp, format=format, quality=quality, **params)
        return

    input_path = tempfile.mktemp(prefix='mcmhomes_save_image_input_', suffix='.png')
    output_path = fp if (type(fp) == str) else tempfile.mktemp(prefix='mcmhomes_save_image_output_', suffix='.tmp')

    image.save(input_path, format='PNG', subsampling=0, progressive=False, optimize=False)

    try:
        command = [
            '/basisu',
            input_path,
            '-output_file', output_path,
            '-comp_level', str(2),
            '-q', str(quality * 2.55),  # convert 0-100 to 0-255
            '-no_alpha',
        ]
        if format_upper == 'KTX2':
            command.append('-ktx2')
        subprocess.check_call(args=command, shell=False, cwd=tempfile.tempdir, stdout=subprocess.DEVNULL)

        if not os.path.exists(output_path):
            raise FileNotFoundError('Error with the basisu call, the output file doesn\'t exist!')

        if type(fp) != str:
            with open(output_path, 'rb') as f:
                fp.write(f.read())
    finally:
        pathlib.Path(input_path).unlink(missing_ok=True)
        if type(fp) != str:
            pathlib.Path(output_path).unlink(missing_ok=True)


# Function to optimize an opaque image (removes alpha channel, turns it grayscale if possible)
def optimize_opaque_image(image: Image):
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    elif image.mode == 'LA':
        return image.convert('L')
    elif image.mode == '1':
        return image

    img_np = np.array(image)
    if np.all(img_np[..., 0] == img_np[..., 1]) and np.all(img_np[..., 1] == img_np[..., 2]):
        return image.convert('L')
    return image


# Function to black out the parts of the image that are masked, can retain parts of the image near the mask based on the given padding radius
def mask_image(image: Image, mask: Image, padding_radius: int = 16):
    if image.size != mask.size:
        raise ValueError('Error in mask_image, the given image and the given mask don\'t have the same dimensions!')

    binary_mask = (np.array(mask) == 0)
    padded_mask = np.pad(binary_mask, padding_radius, mode='constant', constant_values=True)
    eroded_padded_mask = binary_erosion(padded_mask, structure=np.ones((2 * padding_radius + 1, 2 * padding_radius + 1)))
    eroded_mask = eroded_padded_mask[padding_radius:-padding_radius, padding_radius:-padding_radius]

    img_np = np.array(image)
    img_np[eroded_mask] = 0
    img = Image.fromarray(img_np)
    return img.convert('RGB')


# Function to generate cube faces for a panorama image, outputs .tif files, with the face letter as the file name
def generate_cube_faces(input_file: str, output_folder: str, use_gpu: bool = False, input_is_cylindrical: bool = False, horizontal_angle_of_view: float = 360, horizon_offset_pixels: float = 0):
    input_width, input_height = Image.open(input_file).size

    cube_size = 8 * int((360 / horizontal_angle_of_view) * input_width / math.pi / 8)
    cube_size_pow2 = cube_size - 1
    cube_size_pow2 |= cube_size_pow2 >> 1
    cube_size_pow2 |= cube_size_pow2 >> 2
    cube_size_pow2 |= cube_size_pow2 >> 4
    cube_size_pow2 |= cube_size_pow2 >> 8
    cube_size_pow2 |= cube_size_pow2 >> 16
    cube_size_pow2 |= cube_size_pow2 >> 32
    cube_size_pow2 |= cube_size_pow2 >> 64
    cube_size_pow2 += 1
    cube_size = min(2048, cube_size_pow2)  # 2048x2048 is the maximum supported texture size

    faces = ['face0000.tif', 'face0001.tif', 'face0002.tif', 'face0003.tif', 'face0004.tif', 'face0005.tif']
    face_letters = ['l', 'r', 'u', 'd', 'b', 'f']

    os.makedirs(join(output_folder), exist_ok=True)

    pathlib.Path(join(output_folder, 'cubic.pto')).unlink(missing_ok=True)
    for face in faces:
        pathlib.Path(join(output_folder, face)).unlink(missing_ok=True)

    projection = 'f1' if input_is_cylindrical else 'f4'
    pitch = 0
    text = []
    facestr = 'i a0 b0 c0 d0 e' + str(horizon_offset_pixels) + ' ' + str(projection) + ' h' + str(input_height) + ' w' + str(input_width) + ' n"' + str(input_file) + '" r0 v' + str(horizontal_angle_of_view)
    text.append('p E0 R0 f0 h' + str(cube_size) + ' w' + str(cube_size) + ' n"TIFF_m" u0 v90')
    text.append('m g1 i0 m2 p0.00784314')
    text.append(facestr + ' p' + str(pitch + 0) + ' y0')
    text.append(facestr + ' p' + str(pitch + 0) + ' y180')
    text.append(facestr + ' p' + str(pitch - 90) + ' y0')
    text.append(facestr + ' p' + str(pitch + 90) + ' y0')
    text.append(facestr + ' p' + str(pitch + 0) + ' y90')
    text.append(facestr + ' p' + str(pitch + 0) + ' y-90')
    text.append('v')
    text.append('*')
    text = '\n'.join(text)
    with open(join(output_folder, 'cubic.pto'), 'w') as f:
        f.write(text)
    subprocess.check_call(['nona', ('-g' if use_gpu else '-d'), '-o', join(output_folder, 'face'), join(output_folder, 'cubic.pto')])

    pathlib.Path(join(output_folder, 'cubic.pto')).unlink(missing_ok=True)
    for face, face_letter in zip(faces, face_letters):
        pathlib.Path(join(output_folder, face_letter + '.tif')).unlink(missing_ok=True)
        os.rename(join(output_folder, face), join(output_folder, face_letter + '.tif'))
        pathlib.Path(join(output_folder, face)).unlink(missing_ok=True)


# Function to get the number of workers to use for parallel processing
def get_workers_count(mem_gb_per_worker: float = 2.0):
    workers = min(32, (os.cpu_count() or 1) + 7)

    total_mem = virtual_memory()
    mem = total_mem.available / float(1e9)
    mem -= max(2.0, ((total_mem.total / float(1e9)) * 0.2))  # leave some memory for the OS  (20% of total memory, or 2GB, whichever is higher)
    workers = min(workers, math.floor(mem / mem_gb_per_worker))

    return max(1, workers)


# Function to get the value of a field of a JSON file, will error if the file doesn't exist, or can't be opened
def get_json_field(file: str, field: str):
    with open(file, 'r') as f:
        data = json.load(f)
    return data[field]


# Function to set a field to an existing JSON file, will error if the file doesn't exist, can't be opened, or can't be saved
def set_json_field(file: str, field: str, value: str | None = None):
    with open(file, 'r') as f:
        data = json.load(f)

    if value is None:
        data.pop(field, None)
    else:
        data[field] = value

    with open(file, 'w') as f:
        json.dump(data, f)


# Function to get the MD5 hash of a file
def md5_file(file: str):
    with open(file, 'rb') as f:
        file_hash = hashlib.md5()
        while chunk := f.read(8192):
            file_hash.update(chunk)
        return file_hash.hexdigest()


# Function to check if the content of a file is equal to the given string
def does_file_content_equal_string(file: str, string: str):
    try:
        with open(file, 'r') as f:
            return f.read().strip() == string.strip()
    except FileNotFoundError:
        return False


# Function to set the content of a file to the given string
def set_file_content(file: str, string: str):
    with open(file, 'w') as f:
        f.write(string)
