import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {ISSET} from '@lowentry/utils';
import {getLocationIndexByLocationId, getSelectedVariationIndexesBySku, getTexturePathsToRender} from '../utils/PanoramaVariationParsingUtils.jsx';
import {PanoramaRenderer} from '../rendering/PanoramaRenderer.jsx';


export const PanoramaLoaderVariationsParser = ({src = undefined, locationIndex:givenLocationIndex = undefined, ...props}) =>
{
	const {variations, homeId, skus, locationId, host, homeUrl, getErrorWidget, getLoadingWidget} = props;
	
	const variationGroups = variations?.variationGroups;
	const locations = variations?.locations;
	if(!variationGroups || !locations)
	{
		return getErrorWidget({canRetry:false, id:'could-not-connect-to-home', message:'Couldn\'t connect to home: ' + homeId, reason:'the home data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{homeId, host, homeUrl, variations}});
	}
	
	const locationIndex = LeRed.useMemo(() => locationId ? getLocationIndexByLocationId(locations, locationId) : 0, [locationId]);
	if(!ISSET(locationIndex) || !(locationIndex in locations))
	{
		return getErrorWidget({canRetry:false, id:'invalid-location-id', message:'Invalid location ID: ' + locationId, reason:'the location ID doesn\'t exist in the home', data:{homeId, host, homeUrl, variations}});
	}
	
	const locationVariationGroups = locations?.[locationIndex]?.variationGroups;
	if(!locationVariationGroups)
	{
		return getErrorWidget({canRetry:false, id:'could-not-connect-to-home', message:'Couldn\'t connect to home: ' + homeId, reason:'the home data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{homeId, host, homeUrl, variations}});
	}
	
	const selectedVariationIndexes = LeRed.useMemo(() => getSelectedVariationIndexesBySku(variationGroups, skus), [variationGroups, skus]);
	const texturePathsToRender = LeRed.useMemo(() => getTexturePathsToRender(variationGroups, selectedVariationIndexes, locationVariationGroups, locationIndex, homeUrl), [variationGroups, selectedVariationIndexes, locationVariationGroups, locationIndex, homeUrl]);
	
	
	return (<>
		<PanoramaRenderer src={texturePathsToRender} locationIndex={locationIndex} {...props}/>
	</>);
};
