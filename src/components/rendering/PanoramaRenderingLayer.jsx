import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaRenderingLayerSphere} from './PanoramaRenderingLayerSphere.jsx';
import {useFadeoutAnimation} from '../utils/PanoramaReactUtils.jsx';


const FADEOUT_DELAY_MS = 200;
const FADEOUT_DURATION_MS = 800;
const FADEOUT_DURATION_DECAY_FACTOR = Math.pow(0.01, 1 / (FADEOUT_DURATION_MS / 1000));
const FADEOUT_DURATION_LINEAR = false;


export const PanoramaRenderingLayerMinimumLoadTime = FADEOUT_DELAY_MS;
export const PanoramaRenderingLayerFullFadeTimeMs = FADEOUT_DURATION_MS + 200;


export const PanoramaRenderingLayer = LeRed.memo(({src, visible, renderOrder}) =>
{
	const [renderId, setRenderId] = LeRed.useState(LeUtils.uniqueId());
	
	const resolutionsRef = LeRed.useRef([]);
	
	
	LeRed.useEffect(() =>
	{
		return src.addListener({
			onDone:
				({textures, maskTextures}) =>
				{
					const fadeoutDuration = (FADEOUT_DURATION_LINEAR ? FADEOUT_DURATION_MS : null);
					const fadeoutDecayFactor = (FADEOUT_DURATION_LINEAR ? null : FADEOUT_DURATION_DECAY_FACTOR);
					
					LeUtils.each(resolutionsRef.current, resolution => resolution.visible = false);
					resolutionsRef.current.unshift({visible:true, props:{key:LeUtils.uniqueId(), textures, maskTextures, fadeoutDuration, fadeoutDecayFactor}});
					setRenderId(LeUtils.uniqueId());
				},
		}).remove;
	}, [src]);
	
	
	return (<>
		{LeUtils.mapToArray(resolutionsRef.current, (resolution, index) => (
			<PanoramaRenderingLayerResolution {...resolution.props} visible={visible && resolution.visible} renderOrder={renderOrder + (index / resolutionsRef.current.length)}/>
		))}
	</>);
});


const PanoramaRenderingLayerResolution = LeRed.memo(({src, visible, fadeoutDuration, fadeoutDecayFactor, renderOrder, textures, maskTextures}) =>
{
	const {opacity} = useFadeoutAnimation({visible, duration:fadeoutDuration, decayFactor:fadeoutDecayFactor});
	
	
	if(opacity <= 0)
	{
		return null;
	}
	
	return (<>
		<PanoramaRenderingLayerSphere renderOrder={renderOrder} opacity={opacity} radius={1000} textures={textures} maskTextures={maskTextures}/>
	</>);
});
