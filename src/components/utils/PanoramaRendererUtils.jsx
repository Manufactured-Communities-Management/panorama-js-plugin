import {KTX2Loader} from 'three-stdlib';
import {CompressedCubeTexture, CubeTexture, LinearFilter, LinearSRGBColorSpace, MeshBasicMaterial, TextureLoader, UnsignedByteType} from 'three';


export const dispose = (...objects) =>
{
	objects?.forEach(obj =>
	{
		if(Array.isArray(obj))
		{
			dispose(...obj);
			return;
		}
		
		try
		{
			obj?.dispose();
		}
		catch(e)
		{
			console.error('[PanoramaViewer] THREE disposal failed:', typeof obj, obj?.constructor?.name, e);
		}
	});
};


export const loadTextures = (() =>
{
	let ktx2Loader = null;
	let textureLoader = null;
	
	return async (gl, textures, basisTranscoderPath) =>
	{
		if(typeof textures[0] !== 'string')
		{
			return textures;
		}
		
		const loader = (() =>
		{
			if(textures[0].toLowerCase().endsWith('.ktx2'))
			{
				if(ktx2Loader === null)
				{
					ktx2Loader = new KTX2Loader();
					ktx2Loader.setTranscoderPath(basisTranscoderPath);
					ktx2Loader.detectSupport(gl);
				}
				return ktx2Loader;
			}
			
			if(textureLoader === null)
			{
				textureLoader = new TextureLoader();
			}
			return textureLoader;
		})();
		
		const loadedTextures = await Promise.all(textures.map(url => loader.loadAsync(url)));
		loadedTextures.forEach(tex =>
		{
			tex.colorSpace = LinearSRGBColorSpace;
			tex.anisotropy = 16;
			tex.type = UnsignedByteType;
			tex.minFilter = LinearFilter;
			tex.magFilter = LinearFilter;
			tex.generateMipmaps = false;
			tex.flipY = true;
			tex.needsUpdate = true;
		});
		return loadedTextures;
	};
})();


export const createCubeTexture = (textures) =>
{
	const cubeTexture = (() =>
	{
		if(textures[0].isCompressedTexture)
		{
			return new CompressedCubeTexture(textures.map(tex => ({...tex.image, ...tex})), textures[0].format, textures[0].type);
		}
		return new CubeTexture(textures.map(tex => tex.image));
	})();
	
	cubeTexture.format = textures[0].format;
	cubeTexture.type = textures[0].type;
	cubeTexture.wrapS = textures[0].wrapS;
	cubeTexture.wrapT = textures[0].wrapT;
	cubeTexture.colorSpace = textures[0].colorSpace;
	cubeTexture.anisotropy = textures[0].anisotropy;
	cubeTexture.minFilter = textures[0].minFilter;
	cubeTexture.magFilter = textures[0].magFilter;
	cubeTexture.generateMipmaps = false;
	cubeTexture.flipY = false;
	cubeTexture.needsUpdate = true;
	return cubeTexture;
};


export const createCubeMaterial = ({maskEnvMap, ...props}) =>
{
	const material = new MeshBasicMaterial(props);
	material.onBeforeCompile = (shader) =>
	{
		shader.uniforms.maskEnvMap = {value:maskEnvMap};
		
		const fragmentShaderLower = shader.fragmentShader.toLowerCase();
		
		const mainStartIndex = fragmentShaderLower.indexOf('void main()'.toLowerCase());
		if(mainStartIndex < 0)
		{
			console.error('[PanoramaViewer] createCubeMaterial error: shader fragment "void main()" not found', shader.fragmentShader);
			return;
		}
		
		const envmapFragmentStartIndex = fragmentShaderLower.indexOf('#include <envmap_fragment>'.toLowerCase());
		if(envmapFragmentStartIndex < 0)
		{
			console.error('[PanoramaViewer] createCubeMaterial error: shader fragment "#include <envmap_fragment>" not found', shader.fragmentShader);
			return;
		}
		const envmapFragmentEndIndex = fragmentShaderLower.indexOf('>'.toLowerCase(), envmapFragmentStartIndex) + 1;
		
		const startToMain = shader.fragmentShader.substring(0, mainStartIndex);
		const mainToEndEnvmapFragment = shader.fragmentShader.substring(mainStartIndex, envmapFragmentEndIndex);
		const endEnvmapFragmentToEnd = shader.fragmentShader.substring(envmapFragmentEndIndex);
		
		shader.fragmentShader = startToMain + `
			` + (!maskEnvMap ? `` : `uniform samplerCube maskEnvMap;`) + `
			` + mainToEndEnvmapFragment + `
				vec4 maskColor = ` + (!maskEnvMap ? `vec4(1,1,1,1)` : `textureCube(maskEnvMap, envMapRotation * vec3(flipEnvMap * reflectVec.x, reflectVec.yz))`) + `;
				diffuseColor.a *= maskColor.r;
			` + endEnvmapFragmentToEnd;
	};
	return material;
};


export const getTexturePathsOfBasePath = (basePath, type = 'ktx2') =>
{
	if(!basePath)
	{
		return null;
	}
	return [
		[
			basePath + '/0.' + type, // low-res
		],
		[
			basePath + '/1r.' + type, // right
			basePath + '/1l.' + type, // left
			basePath + '/1d.' + type, // down
			basePath + '/1u.' + type, // up
			basePath + '/1f.' + type, // front
			basePath + '/1b.' + type, // back
		],
	];
};
