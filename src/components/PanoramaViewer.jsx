import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaDefaultLoadingWidget} from './widgets/PanoramaDefaultLoadingWidget.jsx';
import {PanoramaDefaultErrorWidget} from './widgets/PanoramaDefaultErrorWidget.jsx';
import {PanoramaLoaderVariationsRetriever} from './loading/PanoramaLoaderVariationsRetriever.jsx';
import {getCorrectedGivenProps, isSceneHostPrivate} from './utils/PanoramaPropsParsingUtils.jsx';


/**
 * @exports
 * @typedef {Object} PanoramaViewerProps
 * @property {string} sceneId
 * @property {string|null} [sceneVersion]
 * @property {string|null} [sceneHost]
 * @property {string[]|null} [skus]
 * @property {string|null} [locationId]
 * @property {((error:{canRetry:boolean, retry:()=>void, message:string, reason:string, id:string, data:Object})=>void)|null} [onError]
 * @property {((error:{canRetry:boolean, retry:()=>void, message:string, reason:string, id:string, data:Object})=>import('react').ReactNode)|null} [errorWidget]
 * @property {(()=>import('react').ReactNode)|null} [loadingWidget]
 * @property {number|null} [minFov]
 * @property {number|null} [maxFov]
 * @property {number|null} [initialFov]
 * @property {string|null} [basisTranscoderPath]
 * @property {((newFov:number)=>void)|null} [onFovChanged]
 * @property {{yaw:number, pitch:number}|null} [initialCameraRotation]
 * @property {((newRotation:{yaw:number, pitch:number})=>void)|null} [onCameraRotationChanged]
 * @property {number|null} [lookSpeed]
 * @property {number|null} [lookSpeedX]
 * @property {number|null} [lookSpeedY]
 * @property {number|null} [zoomSpeed]
 */
/**
 * The PanoramaViewer component is the main component for rendering a panorama scene.
 *
 * @component
 * @type {import('react').FunctionComponent<PanoramaViewerProps>}
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
	
	
	if(!isSceneHostPrivate(sceneHost))
	{
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
	}
	
	if(!attemptId)
	{
		return getLoadingWidget();
	}
	
	return (<>
		<PanoramaLoaderVariationsRetriever sceneId={sceneId} sceneVersion={sceneVersion} skus={skus} locationId={locationId} sceneHost={sceneHost} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} minFov={minFov} maxFov={maxFov} initialFov={initialFov} basisTranscoderPath={basisTranscoderPath} {...other}/>
	</>);
});
