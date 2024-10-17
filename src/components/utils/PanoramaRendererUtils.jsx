import {LeUtils, ISSET, FLOAT_LAX} from '@lowentry/utils';
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
	
	return async (params) =>
	{
		const {gl, textures, basisTranscoderPath} = params;
		
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


export const getTextureIds = (...textures) =>
{
	let result = [];
	const loop = (textures) =>
	{
		textures.forEach(texture =>
		{
			if(Array.isArray(texture))
			{
				loop(texture);
				return;
			}
			if(texture?.uuid)
			{
				result.push(texture.uuid);
			}
		});
	};
	loop(textures);
	return result;
};


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


export const createCubeMaterial = (params) =>
{
	const {maskEnvMap, ...props} = params;
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


export const getTexturePathsOfBasePath = (params) =>
{
	const {basePath, type = 'ktx2'} = params;
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


export const loadMultiresTexture = (params) =>
{
	const {gl, basePath, maskBasePath, type, basisTranscoderPath, minimumLoadTime:givenMinimumLoadTime, onLoadingLevelDone, onLoadingLevelFail} = params;
	const minimumLoadTime = FLOAT_LAX(givenMinimumLoadTime, 0);
	
	const textures = getTexturePathsOfBasePath({basePath, type});
	const maskTextures = getTexturePathsOfBasePath({basePath:maskBasePath, type});
	if(!gl || !textures)
	{
		return;
	}
	
	let listeners = [];
	
	let allLoadTextures = [];
	
	let lastLoadedLevel = -1;
	let lastLoadedTextures = null;
	let lastLoadedMaskTextures = null;
	
	let cancel = false;
	let newLoadedTextures = null;
	let newLoadedMaskTextures = null;
	
	const removeListener = (key) =>
	{
		listeners = listeners.filter(listener => (listener.key !== key));
	};
	
	const addListener = ({onDone, onFail}) =>
	{
		const key = LeUtils.uniqueId();
		listeners.push({key, onDone, onFail});
		if(lastLoadedTextures)
		{
			try
			{
				onDone?.({level:lastLoadedLevel, textures:lastLoadedTextures, maskTextures:lastLoadedMaskTextures});
			}
			catch(e)
			{
				console.error('[PanoramaViewer] loadMultiresTexture listener.onDone failed:', e);
			}
		}
		return {remove:() => removeListener(key)};
	};
	
	const disposeLoadTextures = () =>
	{
		cancel = true;
		
		(async () =>
		{
			dispose(...allLoadTextures);
			allLoadTextures = [];
			lastLoadedTextures = null;
			lastLoadedMaskTextures = null;
			
			dispose(await newLoadedTextures, await newLoadedMaskTextures);
			newLoadedTextures = null;
			newLoadedMaskTextures = null;
			
			dispose(...allLoadTextures);
			allLoadTextures = [];
			lastLoadedTextures = null;
			lastLoadedMaskTextures = null;
		})();
	};
	
	const loadLevel = (async (level, attempt = 1) =>
	{
		try
		{
			if(cancel)
			{
				return;
			}
			if(!ISSET(textures[level]))
			{
				// no more levels
				return;
			}
			
			newLoadedTextures = loadTextures({gl, textures:textures[level], basisTranscoderPath});
			newLoadedMaskTextures = !maskTextures ? null : loadTextures({gl, textures:maskTextures[level], basisTranscoderPath});
			
			let error = null;
			{
				try
				{
					newLoadedTextures = await newLoadedTextures;
				}
				catch(e)
				{
					newLoadedTextures = null;
					error = e;
				}
				try
				{
					newLoadedMaskTextures = await newLoadedMaskTextures;
				}
				catch(e)
				{
					newLoadedMaskTextures = null;
					error = e;
				}
			}
			if(error)
			{
				dispose(newLoadedTextures, newLoadedMaskTextures);
				throw error;
			}
			if(cancel)
			{
				dispose(newLoadedTextures, newLoadedMaskTextures);
				return;
			}
			
			allLoadTextures.push(newLoadedTextures);
			allLoadTextures.push(newLoadedMaskTextures);
			
			lastLoadedLevel = level;
			lastLoadedTextures = newLoadedTextures;
			lastLoadedMaskTextures = newLoadedMaskTextures;
			try
			{
				await onLoadingLevelDone?.({level, textures:newLoadedTextures, maskTextures:newLoadedMaskTextures});
			}
			catch(e)
			{
				console.error('[PanoramaViewer] loadMultiresTexture onLoadingLevelDone failed:', e);
			}
			LeUtils.each(listeners, listener =>
			{
				try
				{
					listener?.onDone?.({level:lastLoadedLevel, textures:lastLoadedTextures, maskTextures:lastLoadedMaskTextures});
				}
				catch(e)
				{
					console.error('[PanoramaViewer] loadMultiresTexture listener.onDone failed:', e);
				}
			});
			await loadLevel(level + 1);
		}
		catch(e)
		{
			if(cancel)
			{
				return;
			}
			if(attempt <= 3)
			{
				await LeUtils.promiseTimeout(500);
				await loadLevel(level, attempt + 1);
				return;
			}
			cancel = true;
			console.error('[PanoramaViewer] loadMultiresTexture texture loading failed:', e);
			try
			{
				await onLoadingLevelFail?.({level, error:e});
			}
			catch(e)
			{
				console.error('[PanoramaViewer] loadMultiresTexture onLoadingLevelFail failed:', e);
			}
			LeUtils.each(listeners, listener =>
			{
				try
				{
					listener?.onFail?.({level:lastLoadedLevel, error:e});
				}
				catch(e)
				{
					console.error('[PanoramaViewer] loadMultiresTexture listener.onFail failed:', e);
				}
			});
		}
	});
	// noinspection JSIgnoredPromiseFromCall
	loadLevel(0);
	
	let minimumTimeWaited = (minimumLoadTime <= 0);
	if(!minimumTimeWaited)
	{
		setTimeout(() =>
		{
			minimumTimeWaited = true;
		}, minimumLoadTime);
	}
	
	return {
		loaderId:   LeUtils.uniqueId(),
		dispose:    disposeLoadTextures,
		isReady:    (minLevel = 0) => cancel || ((lastLoadedLevel >= minLevel) && minimumTimeWaited),
		addListener:addListener,
	};
};
