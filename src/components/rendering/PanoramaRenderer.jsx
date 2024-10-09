import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {PanoramaControls} from '../gameplay/PanoramaControls.jsx';
import {PanoramaRendererTexturePreloader} from './PanoramaRendererTexturePreloader.jsx';


export const PanoramaRenderer = LeRed.memo(({src, homeId, host, homeUrl, locationIndex, basisTranscoderPath, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged, lookSpeed, lookSpeedX, lookSpeedY, zoomSpeed, getErrorWidget, getLoadingWidget}) =>
{
	const [loading, setLoading] = LeRed.useState(true);
	const [error, setError] = LeRed.useState(null);
	
	
	if(error)
	{
		return getErrorWidget(error);
	}
	
	return (<>
		{!!loading && getLoadingWidget()}
		<div style={{width:'100%', height:'100%', overflow:'hidden', ...(!loading ? {} : {width:'1px', height:'1px', opacity:'0'})}}>
			<Canvas flat={true} linear={true} shadows={false} frameloop="demand" gl={{precision:'highp', antialias:false, depth:false, stencil:false}}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged} lookSpeed={lookSpeed} lookSpeedX={lookSpeedX} lookSpeedY={lookSpeedY} zoomSpeed={zoomSpeed}/>
				
				<PanoramaRendererTexturePreloader src={src} homeId={homeId} host={host} homeUrl={homeUrl} locationIndex={locationIndex} basisTranscoderPath={basisTranscoderPath} setLoading={setLoading} setError={setError}/>
			</Canvas>
		</div>
	</>);
});
