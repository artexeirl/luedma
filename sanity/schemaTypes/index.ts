import {brandType} from './documents/brand';
import {claimRecordType} from './documents/claimRecord';
import {categoryType} from './documents/category';
import {homePageType} from './documents/homePage';
import {productType} from './documents/product';
import {siteSettingsType} from './documents/siteSettings';
import {linkType} from './objects/link';
import {seoType} from './objects/seo';

export const schemaTypes = [
  linkType,
  seoType,
  brandType,
  claimRecordType,
  categoryType,
  productType,
  homePageType,
  siteSettingsType,
];
