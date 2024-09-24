import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaSphereMultiRes} from './PanoramaSphereMultiRes.jsx';
import {getTexturePathsOfBasePath} from '../utils/PanoramaRendererUtils.jsx';


const FADEOUT_DELAY_MS = 400;
const FADEOUT_DURATION_MS = 2000;
const FADEOUT_DURATION_DECAY_FACTOR = Math.pow(0.01, 1 / (FADEOUT_DURATION_MS / 1000));
const FADEOUT_DURATION_LINEAR = true;


export const PanoramaLayers = LeRed.memo(({src, layerRenderOrder, visible, basisTranscoderPath}) =>
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
				console.error('[PanoramaViewer] PanoramaLayers fadeout timer removal failed:', e);
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
		{LeUtils.mapToArray(src, (item, index) => (
			<PanoramaSphereMultiRes key={index} renderOrder={(layerRenderOrder * 100) + index} opacity={opacity} radius={1000} textures={getTexturePathsOfBasePath(item.basePath)} maskTextures={getTexturePathsOfBasePath(item.maskBasePath)} basisTranscoderPath={basisTranscoderPath}/>
		))}
	</>);
});
