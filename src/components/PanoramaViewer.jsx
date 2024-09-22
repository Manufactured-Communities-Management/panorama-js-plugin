import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils} from '@lowentry/utils';
import {PanoramaLoaderVersionRetriever} from './loading/PanoramaLoaderVersionRetriever.jsx';
import {PanoramaDefaultLoadingWidget} from './widgets/PanoramaDefaultLoadingWidget.jsx';
import {PanoramaDefaultErrorWidget} from './widgets/PanoramaDefaultErrorWidget.jsx';
import {getCorrectedGivenProps} from './utils/PanoramaPropsParsingUtils';


export const PanoramaViewer = LeRed.memo(({sceneId:givenSceneId, sceneVersion:givenSceneVersion = 'latest', sceneHost:givenSceneHost = null, skus = null, locationId = null, onError = null, errorWidget = null, loadingWidget = null, minFov:givenMinFov, maxFov:givenMaxFov, initialFov:givenInitialFov, basisTranscoderPath:givenBasisTranscoderPath, ...other}) =>
{
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
		<PanoramaLoaderVersionRetriever sceneId={sceneId} sceneVersion={sceneVersion} skus={skus} locationId={locationId} sceneHost={sceneHost} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} minFov={minFov} maxFov={maxFov} initialFov={initialFov} basisTranscoderPath={basisTranscoderPath} {...other}/>
	</>);
});
