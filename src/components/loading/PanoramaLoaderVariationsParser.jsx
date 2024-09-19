import React from 'react';
import {LeRed} from '@lowentry/react-redux';
import {ISSET} from '@lowentry/utils';
import {getLocationIndexByLocationId, getSelectedVariationIndexesBySku, getTexturePathsToRender} from '../utils/PanoramaVariationParsingUtils.jsx';
import {PanoramaLoaderInitialTextureDownloader} from './PanoramaLoaderInitialTextureDownloader.jsx';


export const PanoramaLoaderVariationsParser = ({src = null, ...props}) =>
{
	const {variations, sceneId, skus, locationId, sceneHost, sceneUrl, getErrorWidget, getLoadingWidget} = props;
	
	const variationGroups = variations?.variationGroups;
	const locations = variations?.locations;
	if(!variationGroups || !locations)
	{
		return getErrorWidget({canRetry:false, id:'could-not-connect-to-scene', message:'Couldn\'t connect to scene: ' + sceneId, reason:'the scene data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{sceneId, sceneHost, sceneUrl, variations}});
	}
	
	const locationIndex = LeRed.useMemo(() => locationId ? getLocationIndexByLocationId(locations, locationId) : 0, [locationId]);
	if(!ISSET(locationIndex) || !(locationIndex in locations))
	{
		return getErrorWidget({canRetry:false, id:'invalid-location-id', message:'Invalid location ID: ' + locationId, reason:'the location ID doesn\'t exist in the scene', data:{sceneId, sceneHost, sceneUrl, variations}});
	}
	
	const locationVariationGroups = locations?.[locationIndex]?.variationGroups;
	if(!locationVariationGroups)
	{
		return getErrorWidget({canRetry:false, id:'could-not-connect-to-scene', message:'Couldn\'t connect to scene: ' + sceneId, reason:'the scene data isn\'t compatible with our frontend, it doesn\'t contain the information that should be in there', data:{sceneId, sceneHost, sceneUrl, variations}});
	}
	
	const selectedVariationIndexes = LeRed.useMemo(() => getSelectedVariationIndexesBySku(variationGroups, skus), [variationGroups, skus]);
	const texturePathsToRender = LeRed.useMemo(() => getTexturePathsToRender(variationGroups, selectedVariationIndexes, locationVariationGroups, locationIndex, sceneUrl), [variationGroups, selectedVariationIndexes, locationVariationGroups, locationIndex, sceneUrl]);
	
	
	return (<>
		<PanoramaLoaderInitialTextureDownloader src={texturePathsToRender} {...props}/>
	</>);
};
