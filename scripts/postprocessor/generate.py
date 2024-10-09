#!/usr/bin/env python3

import json
import os
import pathlib
import shutil
import subprocess
import sys
import glob
import tempfile
import time
from PIL import Image
from os.path import join
from concurrent.futures import ProcessPoolExecutor
from generate_utils import resize_image, save_image, optimize_opaque_image, generate_cube_faces, mask_image, get_workers_count, set_json_field, get_json_field


# Obtain and test input arguments
print()
if len(sys.argv) < 3:
    print('ERROR: You must provide the [AWS Access Key ID] and [AWS Secret Access Key] as arguments, or provide "test test" (test-mode) or "sso sso" (SSO authentication) instead')
    sys.exit(1)

version = '20240917'

img_output_formats = ['ktx2']  # ['ktx2', 'webp']
img_output_quality = 90
img_output_thumbnail_resolution = 2048
img_output_thumbnail_quality = 60

input_folder = '/data'
file_output_formats = ['jpg', 'webp', 'basis', 'ktx2']
aws_access_key_id = sys.argv[1]
aws_secret_access_key = sys.argv[2]
input_args = sys.argv[3:]
print('Input directory:', input_folder)
print('Input args:', input_args)
print('AWS Access Key ID:', aws_secret_access_key)
print('AWS Secret Access Key:', aws_secret_access_key)
print()
if not os.path.exists(input_folder):
    print('ERROR: Input directory "' + input_folder + '" doesn\'t exist')
    sys.exit(1)


# Function to execute an AWS CLI command
def aws(*args):
    command = ['aws'] + list(args) + ['--profile', 'dev']
    return subprocess.check_call(args=command, shell=False, cwd=input_folder)


# Function to loop files and remove previous output
def delete_image(filepath):
    filename_with_ext = os.path.basename(filepath)
    filename = os.path.splitext(filename_with_ext)[0]

    shutil.rmtree(join(input_folder, filename), ignore_errors=True)
    for file_output_format in file_output_formats:
        pathlib.Path(join(input_folder, filename + '.' + file_output_format)).unlink(missing_ok=True)


# Function to loop files and generate tiles
def process_image(filepath):
    filename_with_ext = os.path.basename(filepath)
    filename = os.path.splitext(filename_with_ext)[0]

    panorama_type = 'full'
    filename_split = filename.split('_')
    if len(filename_split) >= 4:
        potential_type = filename_split[3]
        if potential_type.endswith('c'):
            panorama_type = 'layer_color'
        elif potential_type.endswith('m'):
            panorama_type = 'layer_mask'

    img = Image.open(filepath)

    if panorama_type == 'layer_mask':
        img = img.convert('L')
    else:
        img = img.convert('RGB')

    if panorama_type == 'layer_color':
        mask_filename_with_ext = str(filename_with_ext).replace('c_', 'm_').replace('c.', 'm.')
        mask = Image.open(join(input_folder, mask_filename_with_ext))
        mask = mask.convert('L')
        img = mask_image(img, mask)

    img_tmp_path = join(input_folder, filename, '_tmp', 'image.tif')
    save_image(img, img_tmp_path)

    img_thumbnail = resize_image(img, img_output_thumbnail_resolution, img_output_thumbnail_resolution // 2)
    for img_output_format in img_output_formats:
        img_thumbnail = img_thumbnail.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        save_image(optimize_opaque_image(img_thumbnail), join(input_folder, filename, '0.' + img_output_format), quality=img_output_thumbnail_quality)

    generate_cube_faces(input_file=img_tmp_path, output_folder=join(input_folder, filename, '_faces'))

    for face in ['f', 'b', 'u', 'd', 'l', 'r']:
        face_img = Image.open(join(input_folder, filename, '_faces', face + '.tif'))
        face_img = face_img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        if face == 'u':
            face_img = face_img.rotate(90)
        if face == 'd':
            face_img = face_img.rotate(270)
        for img_output_format in img_output_formats:
            save_image(optimize_opaque_image(face_img), join(input_folder, filename, '1' + face + '.' + img_output_format), quality=img_output_quality)

    shutil.rmtree(join(input_folder, filename, '_faces'), ignore_errors=True)
    shutil.rmtree(join(input_folder, filename, '_tmp'), ignore_errors=True)

    print(' > ' + filename)


def action():
    # Get the home ID
    home_id = str(get_json_field(join(input_folder, 'variations.json'), 'homeId'))
    print('Home ID:', home_id)

    # Configure S3 and verify access
    print()
    pathlib.Path('~/.aws/credentials').unlink(missing_ok=True)
    pathlib.Path('~/.aws/config').unlink(missing_ok=True)
    aws('configure', 'set', 'region', 'us-east-2')
    aws('configure', 'set', 'output', 'json')
    if not ((aws_access_key_id.lower() == 'test') and (aws_secret_access_key.lower() == 'test')):
        print('Configuring and verifying AWS access...')
        print()
        if not (((aws_access_key_id.lower() == 'sso') or (aws_access_key_id.lower() == 'sso-upload')) and ((aws_secret_access_key.lower() == 'sso') or (aws_secret_access_key.lower() == 'sso-upload'))):
            aws('configure', 'set', 'aws_access_key_id', aws_access_key_id)
            aws('configure', 'set', 'aws_secret_access_key', aws_secret_access_key)
        else:
            aws('configure', 'set', 'sso_session', 'dev')
            aws('configure', 'set', 'sso_region', 'us-east-2')
            aws('configure', 'set', 'sso_start_url', 'https://d-9a6777684f.awsapps.com/start/')
            aws('configure', 'set', 'sso_registration_scopes', 'sso:account:access')
            aws('configure', 'sso')
        aws('sts', 'get-caller-identity')
        print()
        print('Configured and verified AWS access! Will push to S3!')
    else:
        print('Running in test mode, won\'t push to S3')

    # Clears the version field in variations.json, to signal it's not yet processed
    set_json_field(join(input_folder, 'variations.json'), 'version')

    # Loop files and generate tiles
    print()
    if (aws_access_key_id.lower() == 'sso-upload') and (aws_secret_access_key.lower() == 'sso-upload'):
        print('Skipping generating panorama files')
    else:
        print('Generating panorama files...')
        worker_count = get_workers_count(2.0)
        print('Threads: ' + str(worker_count))
        with ProcessPoolExecutor(max_workers=worker_count) as executor:
            executor.map(delete_image, glob.iglob(join(input_folder, '*.png')))
        with ProcessPoolExecutor(max_workers=worker_count) as executor:
            executor.map(process_image, glob.iglob(join(input_folder, '*.png')))
        print('Generated panorama files!')

    # Sets the version field in variations.json, to signal it's processed, and to let it know the version of the processor used
    set_json_field(join(input_folder, 'variations.json'), 'version', version)

    # Push to S3
    if not ((aws_access_key_id.lower() == 'test') and (aws_secret_access_key.lower() == 'test')):
        home_version = str(round(time.time() * 1000))
        s3folder = home_id + '/' + home_version
        print()
        print('Pushing to S3... Bucket ID: "' + s3folder + '"')
        print()
        include_args = []
        for file_output_format in file_output_formats:
            include_args.append('--include')
            include_args.append('*.' + file_output_format)
        aws('s3', 'sync', '.', 's3://panorama-cloud-storage/' + s3folder + '/', '--exclude', '*', *include_args, '--include', '*.json', '--delete', '--cache-control', 'max-age=3600,s-maxage=3600')
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json') as f:
            json.dump({'version': home_version}, f)
            f.flush()
            aws('s3', 'cp', f.name, 's3://panorama-cloud-storage/' + home_id + '/latest.json', '--cache-control', 'max-age=0,s-maxage=3600,must-revalidate')
        print()
        print('Pushed to S3! Bucket ID: "' + s3folder + '"')
        print()
        print('Invalidating CloudFront cache...')
        aws('cloudfront', 'create-invalidation', '--distribution-id', 'E2LL3J30WWH8R7', '--paths', '/' + s3folder + '/*', '/' + home_id + '/latest.json')
        print('Invalidated CloudFront cache!')
        # Done
        print()
        print('Done!')
        print('Test at: https://d11xh1fqz0z9k8.cloudfront.net/?a=' + home_id)
    else:
        # Done
        print()
        print('Done!')


action()
