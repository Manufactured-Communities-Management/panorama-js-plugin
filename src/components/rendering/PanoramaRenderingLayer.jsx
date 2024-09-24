import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaSphereMultiRes} from './PanoramaSphereMultiRes.jsx';
import {getTexturePathsOfBasePath} from '../utils/PanoramaRendererUtils.jsx';


export const FADEOUT_DELAY_MS = 200;
export const FADEOUT_DURATION_MS = 800;
const FADEOUT_DURATION_DECAY_FACTOR = Math.pow(0.01, 1 / (FADEOUT_DURATION_MS / 1000));
const FADEOUT_DURATION_LINEAR = false;


export const PanoramaRenderingLayer = LeRed.memo(({src, visible, layerRenderOrder, basisTranscoderPath}) =>
{
	const opacityRef = LeRed.useRef(1);
	const [opacity, setOpacity] = LeRed.useState(1);
	
	
	LeRed.useEffect(() =>
	{
		if(visible)
		{
			opacityRef.current = 1;
			setOpacity(1);
			return;
		}
		
		let timer = null;
		const stopTimer = () =>
		{
			try
			{
				timer?.remove();
				timer = null;
			}
			catch(e)
			{
				console.error('[PanoramaViewer] PanoramaRenderingLayer fadeout timer removal failed:', e);
			}
		};
		
		timer = LeUtils.setTimeout(() =>
		{
			timer = LeUtils.setAnimationFrameInterval(deltaTime =>
			{
				if(FADEOUT_DURATION_LINEAR)
				{
					opacityRef.current -= deltaTime / (FADEOUT_DURATION_MS / 1000);
				}
				else
				{
					opacityRef.current *= Math.pow(FADEOUT_DURATION_DECAY_FACTOR, deltaTime);
				}
				
				if(opacityRef.current < 0.001)
				{
					opacityRef.current = 0;
				}
				setOpacity(opacityRef.current);
				
				if(opacityRef.current <= 0)
				{
					stopTimer();
				}
			});
		}, FADEOUT_DELAY_MS);
		
		return stopTimer;
	}, [visible]);
	
	
	return (<>
		<PanoramaSphereMultiRes renderOrder={layerRenderOrder} opacity={opacity} radius={1000} textures={getTexturePathsOfBasePath(src.basePath)} maskTextures={getTexturePathsOfBasePath(src.maskBasePath)} basisTranscoderPath={basisTranscoderPath}/>
	</>);
});
