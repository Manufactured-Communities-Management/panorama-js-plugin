import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaRenderingLayerSphere} from './PanoramaRenderingLayerSphere.jsx';


const FADEOUT_DELAY_MS = 200;
const FADEOUT_DURATION_MS = 800;
const FADEOUT_DURATION_DECAY_FACTOR = Math.pow(0.01, 1 / (FADEOUT_DURATION_MS / 1000));
const FADEOUT_DURATION_LINEAR = false;


export const PanoramaRenderingLayerMinimumLoadTime = FADEOUT_DELAY_MS;
export const PanoramaRenderingLayerFullFadeTimeMs = FADEOUT_DURATION_MS + 200;


export const PanoramaRenderingLayer = LeRed.memo(({src, visible, renderOrder}) =>
{
	const [textures, setTextures] = LeRed.useState(null);
	const [maskTextures, setMaskTextures] = LeRed.useState(null);
	
	const opacityRef = LeRed.useRef(1);
	const [opacity, setOpacity] = LeRed.useState(1);
	
	
	LeRed.useEffect(() =>
	{
		return src.addListener({
			onDone:
				({textures, maskTextures}) =>
				{
					setTextures(textures);
					setMaskTextures(maskTextures);
				},
		}).remove;
	}, [src]);
	
	
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
		
		return stopTimer;
	}, [src, visible]);
	
	
	return (<>
		<PanoramaRenderingLayerSphere renderOrder={renderOrder} opacity={opacity} radius={1000} textures={textures} maskTextures={maskTextures}/>
	</>);
});
