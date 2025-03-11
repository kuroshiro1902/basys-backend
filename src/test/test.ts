// // import { ElasticService } from '@/modules/elastic/elastic.service';
// // import { OrganizationRepository } from '@/modules/organization/organization.repository';
// // import { OrganizationService } from '@/modules/organization/organization.service';
// // import { data } from './data';

import { elasticService } from '@/modules/elastic/elastic.service';
import { updateIndex } from '@/modules/elastic/test/updateIndex.test';
import { KeywordsFilePath } from '@/modules/organization/organization.database';
import { organizationService } from '@/modules/organization/organization.service';
import { etlService } from '@/modules/etl/etl.service';
import fs from 'fs/promises';
// import { Mongo } from '@/database/mongo.database';
// import { mongoService } from '@/modules/mongo/mongo.service';
// import { etlService } from '@/modules/schedule/schedule.service';

// // const elasticService = new ElasticService(new OrganizationService(new OrganizationRepository()));
// // const index = 'facebook_raw_posts_test';

// // elasticService.filterCleanPosts({ index: 'facebook_raw_posts', where: { org_id: 2 } }).then(({ posts }) => {
// //   console.log('error: ', posts.slice(0, 2));
// // });

// async function main() {
//   await etlService.syncDataFromESToMongo({ index: 'facebook_raw_posts', size: 2, org_id: 2 });
// }
// main();

elasticService
  .insertPosts(
    'facebook_raw_posts',
    [
      {
        doc_type: 2,
        source_type: 1,
        crawl_source: 1,
        crawl_source_code: 'fb',
        pub_time: 1727666030,
        crawl_time: 1727753874,
        subject_id: null,
        title: null,
        description: null,
        content: 'Chúc mừng sinh nhật Duy Mạnh nhé. Chong bình phục để quay trở lại cháy hết mình cho Hà Nội FC.',
        url: 'https://www.facebook.com/936228925212852_3376291885847685',
        media_urls: '[]',
        comments: 0,
        shares: 0,
        reactions: 0,
        favors: 0,
        views: 0,
        web_tags: '[]',
        web_keywords: '[]',
        auth_id: '100001029320191',
        auth_name: 'Nguyen Hoang Linh',
        auth_type: 1,
        auth_url: 'https://www.facebook.com/100001029320191',
        source_id: '100064772583943',
        source_name: 'Hanoi Football Club',
        source_url: 'https://www.facebook.com/100064772583943',
        reply_to: null,
        level: null,
        sentiment: 0,
        org_id: 2,
        isPriority: true,
      },
    ],
    false,
  )
  .then((keywords) => {
    console.log('keywords: ', keywords);
  });
