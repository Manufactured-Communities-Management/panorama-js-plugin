import {React, LeRed, LeUtils, ISSET, IS_ARRAY, ARRAY, IS_OBJECT, OBJECT, STRING, STRING_ANY, INT, INT_ANY, FLOAT, FLOAT_ANY, INT_LAX, INT_LAX_ANY, FLOAT_LAX, FLOAT_LAX_ANY, BROWSER_URL_QUERY, getBrowserUrlQuery, getBrowserUrlQueryUint, getBrowserUrlQueryBool, setBrowserUrlQuery, dispose, loadTextures, createCubeTexture, createCubeMaterial, getTexturePathsOfBasePath, PanoramaControls, PanoramaViewer, stateVariations, AppStateSlices} from './../../../imports.js';
import {Canvas, useThree} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import * as THREE from 'three';


const PanoramaSphereWithLoadedTextures = LeRed.memo(({radius, textures, maskTextures}) =>
{
	const {gl} = useThree();
	const [sphereMaterial, setSphereMaterial] = LeRed.useState(null);
	const [sphereMaterialProps, setSphereMaterialProps] = LeRed.useState({visible:false});
	
	const geometry = LeRed.useMemo(() =>
	{
		const geom = new THREE.SphereGeometry(radius, 60, 40);
		geom.scale(-1, 1, 1);
		return geom;
	}, [radius]);
	
	
	LeRed.useEffect(() =>
	{
		if(!gl || !textures)
		{
			setSphereMaterialProps({visible:false});
			return;
		}
		
		let cubeTexture = null;
		let maskCubeTexture = null;
		let material = null;
		try
		{
			if(textures.length === 1)
			{
				setSphereMaterialProps({visible:true, transparent:!!maskTextures, map:textures[0], alphaMap:(!maskTextures ? null : maskTextures[0])});
				return;
			}
			
			cubeTexture = createCubeTexture(textures);
			if(!maskTextures)
			{
				setSphereMaterialProps({visible:true, transparent:false, envMap:cubeTexture});
				return;
			}
			
			maskCubeTexture = !maskTextures ? null : createCubeTexture(maskTextures);
			material = createCubeMaterial({visible:true, transparent:true, envMap:cubeTexture, maskEnvMap:maskCubeTexture});
			setSphereMaterial(material);
		}
		catch(e)
		{
			console.error('PanoramaSphereWithLoadedTextures cube texture creation failed:', e);
		}
		
		return () =>
		{
			setSphereMaterial(null);
			dispose(cubeTexture, maskCubeTexture, material);
		};
	}, [gl, textures]);
	
	
	return (
		<mesh geometry={geometry}>
			{!!sphereMaterial && (<primitive object={sphereMaterial}/>)}
			{!sphereMaterial && (<meshBasicMaterial {...sphereMaterialProps}/>)}
		</mesh>
	);
});


const PanoramaSphereMultiRes = LeRed.memo(({radius, textures, maskTextures}) =>
{
	const {gl} = useThree();
	const [level, setLevel] = LeRed.useState(0);
	const [loadedTextures, setLoadedTextures] = LeRed.useState(null);
	const [loadedMaskTextures, setLoadedMaskTextures] = LeRed.useState(null);
	
	
	LeRed.useEffect(() =>
	{
		setLevel(0);
		setLoadedTextures(null);
		setLoadedMaskTextures(null);
	}, [textures, maskTextures]);
	
	
	LeRed.useEffect(() =>
	{
		if(!gl || !textures)
		{
			return;
		}
		
		let cancel = false;
		let newLoadedTextures = null;
		let newLoadedMaskTextures = null;
		(async () =>
		{
			try
			{
				if(!ISSET(textures[level]))
				{
					// no more levels
					return;
				}
				
				newLoadedTextures = await loadTextures(gl, textures[level]);
				if(cancel)
				{
					dispose(newLoadedTextures, newLoadedMaskTextures);
					return;
				}
				
				newLoadedMaskTextures = !maskTextures ? null : await loadTextures(gl, maskTextures[level]);
				if(cancel)
				{
					dispose(newLoadedTextures, newLoadedMaskTextures);
					return;
				}
				
				setLoadedTextures(newLoadedTextures);
				setLoadedMaskTextures(newLoadedMaskTextures);
				setLevel(level + 1);
			}
			catch(e)
			{
				console.error('PanoramaSphereMultiRes texture loading failed:', e);
			}
		})();
		
		return () =>
		{
			cancel = true;
			dispose(newLoadedTextures, newLoadedMaskTextures);
		};
	}, [gl, textures, level]);
	
	
	return (<PanoramaSphereWithLoadedTextures radius={radius} textures={loadedTextures} maskTextures={loadedMaskTextures}/>);
});


export const PanoramaRenderer = LeRed.memo(({src, hotspots, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged}) =>
{
	return (
		<div className="app-widget-panorama-renderer">
			<Canvas flat={true} linear={true}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged}/>
				
				{LeUtils.mapToArray(src, (item, index) => (
					<PanoramaSphereMultiRes key={index} radius={1000 - (index * 5)} textures={getTexturePathsOfBasePath(item.basePath)} maskTextures={getTexturePathsOfBasePath(item.maskBasePath)}/>
				))}
			</Canvas>
		</div>
	);
});
