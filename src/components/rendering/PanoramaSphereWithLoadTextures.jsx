import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {SphereGeometry} from 'three';
import {useThree} from '@react-three/fiber';
import {createCubeMaterial, createCubeTexture, dispose} from '../utils/PanoramaRendererUtils.jsx';


export const PanoramaSphereWithLoadTextures = LeRed.memo(({radius, textures, maskTextures}) =>
{
	const {gl} = useThree();
	const [sphereMaterial, setSphereMaterial] = LeRed.useState(null);
	const [sphereMaterialProps, setSphereMaterialProps] = LeRed.useState({visible:false});
	
	const geometry = LeRed.useMemo(() =>
	{
		const geom = new SphereGeometry(radius, 60, 40);
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
			console.error('[PanoramaViewer] PanoramaSphereWithLoadedTextures cube texture creation failed:', e);
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
