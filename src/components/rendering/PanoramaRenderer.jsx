import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {PanoramaControls} from '../gameplay/PanoramaControls.jsx';
import {PanoramaLayers} from './PanoramaLayers.jsx';


export const PanoramaRenderer = LeRed.memo(({src, basisTranscoderPath, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged, lookSpeed, lookSpeedX, lookSpeedY, zoomSpeed}) =>
{
	const currentLayersRef = LeRed.useRef([]);
	const [currentLayers, setCurrentLayers] = LeRed.useState([]);
	
	
	LeRed.useEffect(() =>
	{
		const first = (currentLayersRef.current.length <= 0);
		
		currentLayersRef.current.push({key:LeUtils.uniqueId(), src:LeUtils.clone(src)});
		setCurrentLayers([...currentLayersRef.current]);
		console.log(currentLayersRef.current);
		
		if(!first)
		{
			LeUtils.setTimeout(() =>
			{
				currentLayersRef.current.shift();
				setCurrentLayers([...currentLayersRef.current]);
			}, 5000);
		}
	}, [src]);
	
	
	return (
		<div style={{width:'100%', height:'100%', overflow:'hidden'}}>
			<Canvas flat={true} linear={true}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged} lookSpeed={lookSpeed} lookSpeedX={lookSpeedX} lookSpeedY={lookSpeedY} zoomSpeed={zoomSpeed}/>
				
				{LeUtils.mapToArray(currentLayers, (layer, index) => (
					<PanoramaLayers key={layer.key} src={layer.src} layerRenderOrder={currentLayers.length - index} visible={index === (currentLayers.length - 1)} basisTranscoderPath={basisTranscoderPath}/>
				))}
			</Canvas>
		</div>
	);
});
