import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaDefaultLoadingWidget} from './widgets/PanoramaDefaultLoadingWidget.jsx';
import {PanoramaDefaultErrorWidget} from './widgets/PanoramaDefaultErrorWidget.jsx';
import {PanoramaLoaderVariationsRetriever} from './loading/PanoramaLoaderVariationsRetriever.jsx';
import {getCorrectedGivenProps} from './utils/PanoramaPropsParsingUtils.jsx';


/**
 * The PanoramaViewer component is the main component for rendering a panorama scene.
 *
 * @param {Object} props
 * @param {string} props.sceneId
 * @param {string|null} [props.sceneVersion]
 * @param {string|null} [props.sceneHost]
 * @param {string[]|null} [props.skus]
 * @param {string|null} [props.locationId]
 * @param {((error:{canRetry:boolean, retry:()=>void, message:string, reason:string, id:string, data:Object})=>void)|null} [props.onError]
 * @param {((error:{canRetry:boolean, retry:()=>void, message:string, reason:string, id:string, data:Object})=>JSX.Element)|null} [props.errorWidget]
 * @param {(()=>JSX.Element)|null} [props.loadingWidget]
 * @param {number|null} [props.minFov]
 * @param {number|null} [props.maxFov]
 * @param {number|null} [props.initialFov]
 * @param {string|null} [props.basisTranscoderPath]
 * @param {((newFov:number)=>void)|null} [props.onFovChanged]
 * @param {{yaw:number, pitch:number}|null} [props.initialCameraRotation]
 * @param {((newRotation:{yaw:number, pitch:number})=>void)|null} [props.onCameraRotationChanged]
 * @param {number|null} [props.lookSpeed]
 * @param {number|null} [props.lookSpeedX]
 * @param {number|null} [props.lookSpeedY]
 * @param {number|null} [props.zoomSpeed]
 *
 * @returns {React.ReactElement}
 */
export const PanoramaViewer = LeRed.memo((props) =>
{
	const {sceneId:givenSceneId, sceneVersion:givenSceneVersion, sceneHost:givenSceneHost, skus, locationId, onError, errorWidget, loadingWidget, minFov:givenMinFov, maxFov:givenMaxFov, initialFov:givenInitialFov, basisTranscoderPath:givenBasisTranscoderPath, ...other} = props;
	
	const {sceneId, sceneVersion, sceneHost, basisTranscoderPath} = LeRed.useMemo(() => getCorrectedGivenProps({sceneId:givenSceneId, sceneVersion:givenSceneVersion, sceneHost:givenSceneHost, basisTranscoderPath:givenBasisTranscoderPath}), [givenSceneId, givenSceneVersion, givenSceneHost, givenBasisTranscoderPath]);
	const {minFov, maxFov, initialFov} = LeRed.useMemo(() => getCorrectedGivenProps({minFov:givenMinFov, maxFov:givenMaxFov, initialFov:givenInitialFov}), [givenMinFov, givenMaxFov, givenInitialFov]);
	
	const [attemptId, setAttemptId] = LeRed.useState(LeUtils.uniqueId());
	
	
	const getErrorWidget = LeRed.useCallback((error) =>
	{
		error = LeUtils.clone(error);
		if(error?.canRetry)
		{
			error.retry = () =>
			{
				setAttemptId(null);
				LeUtils.setAnimationFrameTimeout(() => setAttemptId(LeUtils.uniqueId()));
			};
		}
		
		console.error('[PanoramaViewer] Error: ', error);
		onError?.(LeUtils.clone(error));
		return errorWidget?.(LeUtils.clone(error)) ?? (<PanoramaDefaultErrorWidget {...error}/>);
	}, [onError, errorWidget, setAttemptId]);
	
	
	const getLoadingWidget = LeRed.useCallback(() =>
	{
		return loadingWidget?.() ?? (<PanoramaDefaultLoadingWidget/>);
	}, [loadingWidget]);
	
	
	if(!givenSceneId)
	{
		return getErrorWidget({canRetry:false, id:'missing-scene-id', message:'Missing scene ID', reason:'the PanoramaViewer component was rendered without being given a valid sceneId', data:{sceneId:givenSceneId}});
	}
	if(sceneId !== givenSceneId)
	{
		return getErrorWidget({canRetry:false, id:'invalid-scene-id', message:'Invalid scene ID: ' + givenSceneId, reason:'the scene ID contains invalid characters, only "a-z 0-9 _" is allowed', data:{sceneId:givenSceneId}});
	}
	if(!sceneId)
	{
		return getErrorWidget({canRetry:false, id:'missing-scene-id', message:'Missing scene ID', reason:'the PanoramaViewer component was rendered without being given a valid sceneId', data:{sceneId:givenSceneId}});
	}
	
	if(!attemptId)
	{
		return getLoadingWidget();
	}
	
	return (<>
		<PanoramaLoaderVariationsRetriever sceneId={sceneId} sceneVersion={sceneVersion} skus={skus} locationId={locationId} sceneHost={sceneHost} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} minFov={minFov} maxFov={maxFov} initialFov={initialFov} basisTranscoderPath={basisTranscoderPath} {...other}/>
	</>);
});
