import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {PanoramaControls} from '../gameplay/PanoramaControls.jsx';
import {PanoramaRendererTexturePreloader} from './PanoramaRendererTexturePreloader.jsx';


export const PanoramaRenderer = LeRed.memo(({src, sceneId, sceneHost, sceneUrl, locationIndex, basisTranscoderPath, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged, lookSpeed, lookSpeedX, lookSpeedY, zoomSpeed, getErrorWidget, getLoadingWidget}) =>
{
	return (
		<div style={{width:'100%', height:'100%', overflow:'hidden'}}>
			<Canvas flat={true} linear={true}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged} lookSpeed={lookSpeed} lookSpeedX={lookSpeedX} lookSpeedY={lookSpeedY} zoomSpeed={zoomSpeed}/>
				
				<PanoramaRendererTexturePreloader src={src} sceneId={sceneId} sceneHost={sceneHost} sceneUrl={sceneUrl} locationIndex={locationIndex} basisTranscoderPath={basisTranscoderPath} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget}/>
			</Canvas>
		</div>
	);
});
