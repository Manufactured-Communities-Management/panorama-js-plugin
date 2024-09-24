import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {ISSET} from '@lowentry/utils';
import {useThree} from '@react-three/fiber';
import {dispose, loadTextures} from '../utils/PanoramaRendererUtils.jsx';
import {PanoramaSphereWithLoadTextures} from './PanoramaSphereWithLoadTextures.jsx';


export const PanoramaSphereMultiRes = LeRed.memo(({textures, maskTextures, basisTranscoderPath, ...other}) =>
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
				
				newLoadedTextures = await loadTextures(gl, textures[level], basisTranscoderPath);
				if(cancel)
				{
					dispose(newLoadedTextures, newLoadedMaskTextures);
					return;
				}
				
				newLoadedMaskTextures = !maskTextures ? null : await loadTextures(gl, maskTextures[level], basisTranscoderPath);
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
				console.error('[PanoramaViewer] PanoramaSphereMultiRes texture loading failed:', e);
			}
		})();
		
		return () =>
		{
			cancel = true;
			dispose(newLoadedTextures, newLoadedMaskTextures);
		};
	}, [gl, textures, level]);
	
	
	return (<PanoramaSphereWithLoadTextures textures={loadedTextures} maskTextures={loadedMaskTextures} {...other}/>);
});
