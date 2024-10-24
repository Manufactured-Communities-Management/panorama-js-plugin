import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {LeUtils, ISSET} from '@lowentry/utils';
import {getSelectedVariationIndexesBySku, getTexturePathsToRender} from '../utils/PanoramaVariationParsingUtils.jsx';
import {PanoramaRenderer} from '../rendering/PanoramaRenderer.jsx';


export const PanoramaLoaderVariationsParser = ({src = undefined, styleIndex:givenStyleIndex = undefined, locationIndex:givenLocationIndex = undefined, ...props}) =>
{
	const {variations, homeId, skus, styleId, locationId, host, homeUrl, getErrorWidget, getLoadingWidget} = props;
	
	const styles = variations?.styles;
	const locations = variations?.locations?.filter(location => LeUtils.contains(location?.supportedStyleIds, styleId));
	if(!styles || !locations)
	{
		return getErrorWidget({canRetry:false, id:'could-not-connect-to-home', message:'Couldn\'t connect to home: ' + homeId, reason:'the home data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{homeId, host, homeUrl, variations}});
	}
	
	const styleIndex = LeRed.useMemo(() => styleId ? LeUtils.findIndex(styles, style => (style?.styleId === styleId)) : 0, [styles, styleId]);
	if(!ISSET(styleIndex) || !(styleIndex in styles))
	{
		return getErrorWidget({canRetry:false, id:'invalid-style-id', message:'Invalid style ID: ' + styleId, reason:'the style ID doesn\'t exist in the home', data:{homeId, host, homeUrl, variations, styleId}});
	}
	
	const locationIndex = LeRed.useMemo(() => locationId ? LeUtils.findIndex(locations, location => (location?.locationId === locationId)) : 0, [locations, locationId]);
	if(!ISSET(locationIndex) || !(locationIndex in locations))
	{
		return getErrorWidget({canRetry:false, id:'invalid-location-id', message:'Invalid location ID: ' + locationId, reason:'the location ID doesn\'t exist in the home', data:{homeId, host, homeUrl, variations, locationId}});
	}
	
	const variationGroups = styles?.[styleIndex]?.variationGroups;
	const locationVariationGroups = locations?.[locationIndex]?.variationGroups;
	if(!variationGroups || !locationVariationGroups)
	{
		return getErrorWidget({canRetry:false, id:'could-not-connect-to-home', message:'Couldn\'t connect to home: ' + homeId, reason:'the home data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{homeId, host, homeUrl, variations}});
	}
	
	const selectedVariationIndexes = LeRed.useMemo(() => getSelectedVariationIndexesBySku(variationGroups, skus), [variationGroups, skus]);
	const texturePathsToRender = LeRed.useMemo(() => getTexturePathsToRender(variationGroups, selectedVariationIndexes, locationVariationGroups, styleIndex, locationIndex, homeUrl), [variationGroups, selectedVariationIndexes, locationVariationGroups, styleIndex, locationIndex, homeUrl]);
	
	
	return (<>
		<PanoramaRenderer src={texturePathsToRender} styleIndex={styleIndex} locationIndex={locationIndex} {...props}/>
	</>);
};
