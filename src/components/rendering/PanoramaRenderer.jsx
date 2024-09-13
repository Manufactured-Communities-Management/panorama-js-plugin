import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {Canvas} from '@react-three/fiber';
import {PerspectiveCamera} from '@react-three/drei';
import {getTexturePathsOfBasePath} from '../utils/PanoramaRendererUtils';
import {PanoramaControls} from '../gameplay/PanoramaControls';
import {PanoramaSphereMultiRes} from './PanoramaSphereMultiRes';


export const PanoramaRenderer = LeRed.memo(({src, hotspots, minFov, maxFov, initialFov, onFovChanged, initialCameraRotation, onCameraRotationChanged}) =>
{
	return (
		<div className="app-widget-panorama-renderer">
			<Canvas flat={true} linear={true}>
				<PerspectiveCamera makeDefault position={[0, 0, 0]}/>
				<PanoramaControls minFov={minFov} maxFov={maxFov} initialFov={initialFov} onFovChanged={onFovChanged} initialCameraRotation={initialCameraRotation} onCameraRotationChanged={onCameraRotationChanged}/>
				
				{LeUtils.mapToArray(src, (item, index) => (
					<PanoramaSphereMultiRes key={index} radius={1000 - (index * 5)} textures={getTexturePathsOfBasePath(item.basePath)} maskTextures={getTexturePathsOfBasePath(item.maskBasePath)}/>
				))}
			</Canvas>
		</div>
	);
});