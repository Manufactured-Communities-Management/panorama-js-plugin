import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils, STRING, STRING_ANY, FLOAT_LAX_ANY} from '@lowentry/utils';
import {PanoramaLoaderVersionRetriever} from './loading/PanoramaLoaderVersionRetriever.jsx';
import {PanoramaDefaultLoadingWidget} from './widgets/PanoramaDefaultLoadingWidget.jsx';


export const PanoramaViewer = LeRed.memo(({sceneId:givenSceneId, sceneVersion:givenSceneVersion = 'latest', skus = null, locationId = null, sceneHost:givenSceneHost = null, onError = null, errorWidget = null, loadingWidget = null, minFov:givenMinFov, maxFov:givenMaxFov, initialFov:givenInitialFov, basisTranscoderPath:givenBasisTranscoderPath, ...other}) =>
{
	const sceneId = LeRed.useMemo(() => STRING(givenSceneId).replace(/[^a-z0-9_]+/g, ''), givenSceneId);
	const sceneVersion = LeRed.useMemo(() => STRING(!givenSceneVersion ? 'latest' : givenSceneVersion).trim().toLowerCase(), givenSceneVersion);
	const sceneHost = STRING_ANY(givenSceneHost, 'https://d1i78mubvvqzk6.cloudfront.net');
	
	const minFov = Math.max(1, FLOAT_LAX_ANY(givenMinFov, 20));
	const maxFov = Math.min(179, FLOAT_LAX_ANY(givenMaxFov, 130));
	const initialFov = Math.max(minFov, Math.min(maxFov, FLOAT_LAX_ANY(givenInitialFov, 95)));
	
	const basisTranscoderPath = STRING_ANY(givenBasisTranscoderPath, 'https://d11xh1fqz0z9k8.cloudfront.net/basis_transcoder/');
	
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
		return errorWidget?.(LeUtils.clone(error));
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
