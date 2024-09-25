import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {STRING} from '@lowentry/utils';
import {PanoramaLoaderVariationsParser} from './PanoramaLoaderVariationsParser.jsx';
import {useVariationJsonData} from '../utils/PanoramaVariationObtainingUtils.jsx';


export const PanoramaLoaderVariationsRetriever = LeRed.memo(({variations:givenVariations = undefined, sceneVersion:givenSceneVersion, ...props}) =>
{
	const {sceneId, sceneHost, getErrorWidget, getLoadingWidget} = props;
	
	const [variations, variationsLoading, variationsError] = useVariationJsonData({sceneId, sceneVersion:givenSceneVersion, sceneHost});
	
	
	if(variationsLoading)
	{
		return getLoadingWidget();
	}
	if(!variations?.version || !variations?.url || !variations?.data)
	{
		return getErrorWidget({canRetry:true, id:'could-not-connect-to-scene', message:'Couldn\'t connect to scene: ' + sceneId, reason:STRING(variationsError), data:{sceneId, sceneVersion:givenSceneVersion, sceneHost}});
	}
	
	return (<>
		<PanoramaLoaderVariationsParser sceneVersion={STRING(variations.version)} sceneUrl={STRING(variations.url)} variations={variations.data} {...props}/>
	</>);
});
