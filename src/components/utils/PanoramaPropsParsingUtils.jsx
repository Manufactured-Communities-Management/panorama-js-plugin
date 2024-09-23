import {LeUtils, FLOAT_LAX_ANY, STRING, STRING_ANY} from '@lowentry/utils';


export const getCorrectedGivenProps = (props) =>
{
	const result = {};
	LeUtils.each(props, (value, key) =>
	{
		let newValue = value;
		switch(key)
		{
			case 'sceneId':
				newValue = STRING(value).replace(/[^a-zA-Z0-9_]+/g, '');
				break;
			case 'sceneVersion':
				newValue = STRING(!value ? 'latest' : value).trim().toLowerCase();
				break;
			case 'sceneHost':
				newValue = STRING_ANY(value, 'https://d1i78mubvvqzk6.cloudfront.net');
				break;
			case 'minFov':
				newValue = Math.max(1, FLOAT_LAX_ANY(value, 20));
				break;
			case 'maxFov':
				newValue = Math.min(179, FLOAT_LAX_ANY(value, 130));
				break;
			case 'initialFov':
				const minFov = Math.max(1, FLOAT_LAX_ANY(result.minFov, 20));
				const maxFov = Math.min(179, FLOAT_LAX_ANY(result.maxFov, 130));
				newValue = Math.max(minFov, Math.min(maxFov, FLOAT_LAX_ANY(value, 95)));
				break;
			case 'basisTranscoderPath':
				newValue = STRING_ANY(value, 'https://d11xh1fqz0z9k8.cloudfront.net/basis_transcoder/');
				break;
		}
		result[key] = newValue;
	});
	return result;
};
