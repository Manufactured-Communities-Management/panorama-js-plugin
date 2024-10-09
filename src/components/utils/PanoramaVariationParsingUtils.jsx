import {LeUtils, IS_ARRAY, IS_OBJECT, ISSET, ARRAY} from '@lowentry/utils';


export const getVariationGroupIndexByGroupId = (variationGroups, groupId) =>
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

export const getVariationIndexOfVariationGroupBySku = (variationGroup, sku) =>
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

export const getLocationIndexByLocationId = (locations, locationId) =>
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


export const getSelectedVariationIndexesBySku = (variationGroups, skus) =>
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


export const getTexturePathsToRender = (variationGroups, selectedVariationIndexes, locationVariationGroups, locationIndex, homeUrl) =>
{
	if(!selectedVariationIndexes.length)
	{
		return [];
	}
	
	let result = [];
	let variationIndexesForLocation = [];
	let locationVariationIndexIndexed = {};
	let locationVariationGroupsIndexed = {};
	
	/** add full render **/
	LeUtils.each(variationGroups, (group, groupIndex) =>
	{
		const locationVariationIndex = getVariationGroupIndexByGroupId(locationVariationGroups, group?.groupId);
		const locationVariationGroup = (locationVariationIndex === null) ? null : locationVariationGroups?.[locationVariationIndex];
		locationVariationIndexIndexed[group?.groupId] = locationVariationIndex;
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
	result.push({locationIndex, layerRenderOrder:0, basePath:homeUrl + 'img_' + locationIndex + '_' + variationIndexesForLocation.join('_')});
	
	/** add layers **/
	LeUtils.each(variationGroups, (layerGroup, layerGroupIndex) =>
	{
		const locationVariationGroup = locationVariationGroupsIndexed[layerGroup?.groupId];
		if(!locationVariationGroup || !locationVariationGroup?.layer)
		{
			return;
		}
		const locationVariationIndex = locationVariationIndexIndexed[layerGroup?.groupId];
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
		result.push({locationIndex, layerRenderOrder:(locationVariationIndex + 1), basePath:homeUrl + colorPath, maskBasePath:homeUrl + maskPath});
	});
	
	return result;
};
