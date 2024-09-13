import {LeRed} from '@lowentry/react-redux';
import {LeUtils, STRING, STRING_ANY, IS_ARRAY, IS_OBJECT, ISSET, ARRAY} from '@lowentry/utils';


export const PanoramaViewer = LeRed.memo(({sceneId:givenSceneId, skus = null, locationId:givenLocationId = null, sceneHost:givenSceneHost = null, onError = null, errorWidget = null, loadingWidget = null, ...props}) =>
{
	const sceneId = LeRed.useMemo(() => STRING(sceneId).replace(/[^0-9]+/g, ''), givenSceneId);
	const sceneHost = STRING_ANY(sceneHost, 'https://d1i78mubvvqzk6.cloudfront.net');
	const sceneUrl = sceneHost + '/' + sceneId + '/';
	
	
	const getErrorWidget = LeRed.useCallback((error) =>
	{
		console.error('[PanoramaViewer] Error: ', error);
		onError?.(error);
		return errorWidget?.(error) ?? null;
	}, [onError, errorWidget]);
	
	const getLoadingWidget = LeRed.useCallback(() =>
	{
		return loadingWidget ?? (<div style={{animation:'spin 1s linear infinite', border:'3px solid #3BA5CA', borderRightColor:'#00000000'}}/>);
	}, [loadingWidget]);
	
	
	if(!sceneId)
	{
		return getErrorWidget({canRetry:false, id:'missing-scene-id', message:'Missing scene ID', reason:'the PanoramaViewer component was rendered without being given a valid sceneId', data:{}});
	}
	
	return (<>
		<PanoramaViewerRetriever sceneId={sceneId} skus={skus} locationId={locationId} sceneHost={sceneHost} getErrorWidget={getErrorWidget} getLoadingWidget={getLoadingWidget} {...props}/>
	</>);
});


//


const PanoramaViewerRetriever = LeRed.memo(({...props}) =>
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
		<PanoramaViewerParser variations={variations} {...props}/>
	</>);
});


//


const getVariationGroupIndexByGroupId = (variationGroups, groupId) =>
{
	let variationGroupIndex = null;
	LeUtils.each(variationGroups, (group, index) =>
	{
		if(group?.groupId === groupId)
		{
			variationGroupIndex = index;
			return false;
		}
	});
	return variationGroupIndex;
};

const getVariationIndexOfVariationGroupBySku = (variationGroup, sku) =>
{
	let variationIndex = null;
	LeUtils.each(variationGroup?.variations, (variation, index) =>
	{
		if(variation?.sku === sku)
		{
			variationIndex = index;
			return false;
		}
	});
	return variationIndex;
};

const getLocationIndexByLocationId = (locations, locationId) =>
{
	let locationIndex = null;
	LeUtils.each(locations, (location, index) =>
	{
		if(location?.locationId === locationId)
		{
			locationIndex = index;
			return false;
		}
	});
	return locationIndex;
};


const getSelectedVariationIndexesBySku = (variationGroups, skus) =>
{
	const selectedVariationIndexes = LeUtils.mapToArray(variationGroups, () => 0);
	if(IS_ARRAY(skus))
	{
		LeUtils.each(skus, (sku, groupIndex) =>
		{
			let skuFound = false;
			LeUtils.each(variationGroups, (group, groupIndex) =>
			{
				let variationIndex = getVariationIndexOfVariationGroupBySku(group, sku);
				if(variationIndex !== null)
				{
					selectedVariationIndexes[groupIndex] = variationIndex;
					skuFound = true;
				}
			});
			if(!skuFound)
			{
				console.warn('[PanoramaViewer] SKU not found:', sku);
			}
		});
	}
	else if(IS_OBJECT(skus))
	{
		LeUtils.each(skus, (sku, groupId) =>
		{
			const groupIndex = getVariationGroupIndexByGroupId(variationGroups, groupId);
			if(groupIndex !== null)
			{
				const group = variationGroups[groupIndex];
				const variationIndex = getVariationIndexOfVariationGroupBySku(group, sku);
				if(variationIndex !== null)
				{
					selectedVariationIndexes[groupIndex] = variationIndex;
				}
				else
				{
					console.warn('[PanoramaViewer] SKU not found in group:', sku, group);
				}
			}
			else
			{
				console.warn('[PanoramaViewer] Group ID not found:', groupId);
			}
		});
	}
	else if(ISSET(skus))
	{
		console.warn('[PanoramaViewer] Invalid SKUs:', skus);
	}
	return selectedVariationIndexes;
};


const getTexturePathsToRender = (variationGroups, selectedVariationIndexes, locationVariationGroups, locationIndex, sceneUrl) =>
{
	if(!selectedVariationIndexes.length)
	{
		return [];
	}
	
	let result = [];
	let variationIndexesForLocation = [];
	let locationVariationGroupsIndexed = {};
	
	/** add full render **/
	LeUtils.each(variationGroups, (group, groupIndex) =>
	{
		const locationVariationGroup = locationVariationGroups?.[getVariationGroupIndexByGroupId(locationVariationGroups, group?.groupId)];
		locationVariationGroupsIndexed[group?.groupId] = locationVariationGroup;
		if(locationVariationGroup && !locationVariationGroup?.layer)
		{
			variationIndexesForLocation.push(selectedVariationIndexes[groupIndex] ?? 0);
		}
		else
		{
			variationIndexesForLocation.push(0);
		}
	});
	result.push({basePath:sceneUrl + 'img_' + locationIndex + '_' + variationIndexesForLocation.join('_')});
	
	/** add layers **/
	LeUtils.each(variationGroups, (layerGroup, layerGroupIndex) =>
	{
		const locationVariationGroup = locationVariationGroupsIndexed[layerGroup?.groupId];
		if(!locationVariationGroup || !locationVariationGroup?.layer)
		{
			return;
		}
		variationIndexesForLocation = [];
		LeUtils.each(variationGroups, (group, groupIndex) =>
		{
			if((layerGroup?.groupId === group?.groupId) || ARRAY(locationVariationGroup?.layerDependencyGroupIds).includes(group?.groupId))
			{
				variationIndexesForLocation.push(selectedVariationIndexes[groupIndex] ?? 0);
			}
			else
			{
				variationIndexesForLocation.push(0);
			}
		});
		const colorPath = 'img_' + locationIndex + '_' + layerGroupIndex + 'c_' + variationIndexesForLocation.join('_');
		const maskPath = 'img_' + locationIndex + '_' + layerGroupIndex + 'm_' + variationIndexesForLocation.join('_');
		result.push({basePath:sceneUrl + colorPath, maskBasePath:sceneUrl + maskPath});
	});
	
	return result;
};


const PanoramaViewerParser = ({...props}) =>
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
		<PanoramaViewer src={texturePathsToRender}/>
	</>);
};
