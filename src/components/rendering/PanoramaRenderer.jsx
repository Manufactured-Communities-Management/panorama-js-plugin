import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {PanoramaControls} from '../gameplay/PanoramaControls.jsx';
import {PanoramaRenderingLayer, FADEOUT_DELAY_MS, FADEOUT_DURATION_MS} from './PanoramaRenderingLayer.jsx';


export const PanoramaRenderer = LeRed.memo(({src, locationIndex, basisTranscoderPath, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged, lookSpeed, lookSpeedX, lookSpeedY, zoomSpeed}) =>
{
	const currentLayersRef = LeRed.useRef([]);
	const [currentLayers, setCurrentLayers] = LeRed.useState([]);
	
	
	LeRed.useEffect(() =>
	{
		let newSrc = {};
		LeUtils.each(src, (item, index) =>
		{
			newSrc[item.basePath] = item;
		});
		
		LeUtils.each(currentLayersRef.current, (layer) =>
		{
			if(!layer.visible)
			{
				return;
			}
			if(newSrc[layer.src.basePath])
			{
				delete newSrc[layer.src.basePath];
				return;
			}
			layer.visible = false;
			layer.visibleLastTime = Date.now();
			
			LeUtils.setTimeout(() =>
			{
				currentLayersRef.current = currentLayersRef.current.filter(item => (item.key !== layer.key));
				setCurrentLayers([...currentLayersRef.current]);
			}, FADEOUT_DELAY_MS + FADEOUT_DURATION_MS + 200);
		});
		
		LeUtils.each(newSrc, (item, basePath) =>
		{
			currentLayersRef.current.push({key:LeUtils.uniqueId(), src:LeUtils.clone(item), visible:true});
		});
		
		currentLayersRef.current.sort((a, b) =>
		{
			if(a.src.locationIndex !== b.src.locationIndex)
			{
				if(a.src.locationIndex === locationIndex)
				{
					return -1;
				}
				return 1;
			}
			if(a.src.layerRenderOrder < b.src.layerRenderOrder)
			{
				return -1;
			}
			if(a.src.layerRenderOrder > b.src.layerRenderOrder)
			{
				return 1;
			}
			if(!a.visible && !b.visible)
			{
				if(a.visibleLastTime < b.visibleLastTime)
				{
					return 1;
				}
				if(a.visibleLastTime > b.visibleLastTime)
				{
					return -1;
				}
				return 0;
			}
			if(!a.visible)
			{
				return 1;
			}
			if(!b.visible)
			{
				return -1;
			}
			return 0;
		});
		setCurrentLayers([...currentLayersRef.current]);
	}, [src]);
	
	
	return (
		<div style={{width:'100%', height:'100%', overflow:'hidden'}}>
			<Canvas flat={true} linear={true}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged} lookSpeed={lookSpeed} lookSpeedX={lookSpeedX} lookSpeedY={lookSpeedY} zoomSpeed={zoomSpeed}/>
				
				{LeUtils.mapToArray(currentLayers, (layer, index) => (
					<PanoramaRenderingLayer key={layer.key} src={layer.src} visible={layer.visible} layerRenderOrder={index} basisTranscoderPath={basisTranscoderPath}/>
				))}
			</Canvas>
		</div>
	);
});
