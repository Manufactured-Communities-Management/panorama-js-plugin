import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {getTexturePathsOfBasePath} from '../utils/PanoramaRendererUtils.jsx';
import {PanoramaControls} from '../gameplay/PanoramaControls.jsx';
import {PanoramaSphereMultiRes} from './PanoramaSphereMultiRes.jsx';


export const PanoramaRenderer = LeRed.memo(({src, basisTranscoderPath, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged, lookSpeed, lookSpeedX, lookSpeedY, zoomSpeed}) =>
{
	return (
		<div style={{width:'100%', height:'100%', overflow:'hidden'}}>
			<Canvas flat={true} linear={true}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged} lookSpeed={lookSpeed} lookSpeedX={lookSpeedX} lookSpeedY={lookSpeedY} zoomSpeed={zoomSpeed}/>
				
				{LeUtils.mapToArray(src, (item, index) => (
					<PanoramaSphereMultiRes key={index} radius={1000 - (index * 5)} textures={getTexturePathsOfBasePath(item.basePath)} maskTextures={getTexturePathsOfBasePath(item.maskBasePath)} basisTranscoderPath={basisTranscoderPath}/>
				))}
			</Canvas>
		</div>
	);
});
