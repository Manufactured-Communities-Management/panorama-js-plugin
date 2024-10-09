import {LeUtils, IS_ARRAY, IS_OBJECT, ISSET} from '@lowentry/utils';


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
				let variationIndex = LeUtils.findIndex(group?.variations, variation => variation?.sku === sku);
				if(ISSET(variationIndex))
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
			const groupIndex = LeUtils.findIndex(variationGroups, variationGroup => variationGroup?.groupId === groupId);
			if(groupIndex !== null)
			{
				const group = variationGroups[groupIndex];
				const variationIndex = LeUtils.findIndex(group?.variations, variation => variation?.sku === sku);
				if(ISSET(variationIndex))
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


export const getTexturePathsToRender = (variationGroups, selectedVariationIndexes, locationVariationGroups, styleIndex, locationIndex, homeUrl) =>
{
	let result = [];
	let variationIndexesForLocation = [];
	let locationVariationIndexIndexed = {};
	let locationVariationGroupsIndexed = {};
	
	/** add full render **/
	LeUtils.each(variationGroups, (group, groupIndex) =>
	{
		const locationVariationIndex = LeUtils.findIndex(locationVariationGroups, locationVariationGroup => locationVariationGroup?.groupId === group?.groupId);
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
	result.push({styleIndex, locationIndex, layerRenderOrder:0, basePath:homeUrl + 'img_' + styleIndex + '_' + locationIndex + ((variationIndexesForLocation.length > 0) ? '_' : '') + variationIndexesForLocation.join('_')});
	
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
			if((layerGroup?.groupId === group?.groupId) || LeUtils.contains(locationVariationGroup?.layerDependencyGroupIds, group?.groupId))
			{
				variationIndexesForLocation.push(selectedVariationIndexes[groupIndex] ?? 0);
			}
			else
			{
				variationIndexesForLocation.push(0);
			}
		});
		const colorPath = 'img_' + styleIndex + '_' + locationIndex + '_' + layerGroupIndex + 'c' + ((variationIndexesForLocation.length > 0) ? '_' : '') + variationIndexesForLocation.join('_');
		const maskPath = 'img_' + styleIndex + '_' + locationIndex + '_' + layerGroupIndex + 'm' + ((variationIndexesForLocation.length > 0) ? '_' : '') + variationIndexesForLocation.join('_');
		result.push({styleIndex, locationIndex, layerRenderOrder:(locationVariationIndex + 1), basePath:homeUrl + colorPath, maskBasePath:homeUrl + maskPath});
	});
	
	return result;
};
