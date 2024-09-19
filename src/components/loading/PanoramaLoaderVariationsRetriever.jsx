import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {STRING} from '@lowentry/utils';
import {PanoramaLoaderVariationsParser} from './PanoramaLoaderVariationsParser.jsx';


export const PanoramaLoaderVariationsRetriever = LeRed.memo(({variations:givenVariations = null, ...props}) =>
{
	const {sceneId, sceneHost, sceneUrl, getErrorWidget, getLoadingWidget} = props;
	
	const [variations, variationsLoading, variationsError] = LeRed.useExternalJson(sceneUrl + 'variations.json');
	
	
	if(!variationsLoading && !variations)
	{
		return getErrorWidget({canRetry:true, id:'could-not-connect-to-scene', message:'Couldn\'t connect to scene: ' + sceneId, reason:STRING(variationsError), data:{sceneId, sceneHost, sceneUrl}});
	}
	if(variationsLoading)
	{
		return getLoadingWidget();
	}
	
	return (<>
		<PanoramaLoaderVariationsParser variations={variations} {...props}/>
	</>);
});
