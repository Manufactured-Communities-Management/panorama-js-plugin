import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {STRING} from '@lowentry/utils';
import {PanoramaLoaderVariationsParser} from './PanoramaLoaderVariationsParser.jsx';
import {useVariationJsonData} from '../utils/PanoramaVariationObtainingUtils.jsx';


export const PanoramaLoaderVariationsRetriever = LeRed.memo(({variations:givenVariations = undefined, homeVersion:givenHomeVersion, ...props}) =>
{
	const {homeId, host, getErrorWidget, getLoadingWidget} = props;
	
	const [variations, variationsLoading, variationsError] = useVariationJsonData({homeId, homeVersion:givenHomeVersion, host});
	
	
	if(variationsLoading)
	{
		return getLoadingWidget();
	}
	if(!variations?.version || !variations?.url || !variations?.data)
	{
		return getErrorWidget({canRetry:true, id:'could-not-connect-to-home', message:'Couldn\'t connect to home: ' + homeId, reason:STRING(variationsError), data:{homeId, homeVersion:givenHomeVersion, host}});
	}
	
	return (<>
		<PanoramaLoaderVariationsParser homeVersion={STRING(variations.version)} homeUrl={STRING(variations.url)} variations={variations.data} {...props}/>
	</>);
});
