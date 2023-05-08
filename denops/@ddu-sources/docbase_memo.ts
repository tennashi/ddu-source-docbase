import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/source.ts";
import { globals } from "https://deno.land/x/denops_std@v4.1.8/variable/mod.ts";
import ky from "https://esm.sh/ky";

import { ActionData } from "../@ddu-kinds/docbase_memo.ts";

type Params = Record<never, never>;

type GetPostsResponse = {
  posts: Post[];
  meta: GetPostsResponseMetadata;
};

type GetPostsResponseMetadata = {
  previous_page?: string;
  next_page?: string;
  total: number;
};

type Post = {
  id: number;
  title: string;
  body: string;
  draft: boolean;
  archived: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  scope: string;
  sharing_url: string;
  tags: Tag[];
  user: User;
  stars_count: number;
  good_jobs_count: number;
  comments: Comment[];
  groups: Group[];
};

type Tag = Record<string, string>;
type User = {
  id: number;
  name: string;
  profile_image_url: string;
};
type Comment = {
  id: number;
  body: string;
  created_at: string;
  user: User;
};
type Group = any;

export class Source extends BaseSource<Params> {
  kind = "docbase_memo";

  gather(args: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const apiToken = await globals.get(
          args.denops,
          "ddu#source#docbase#api_token",
          "",
        );
        const teamName = await globals.get(
          args.denops,
          "ddu#source#docbase#team_name",
          "",
        );

        const res = await ky.get(
          `https://api.docbase.io/teams/${teamName}/posts`,
          {
            headers: {
              "X-DocBaseToken": apiToken,
            },
          },
        ).json() as GetPostsResponse;
        const items = res.posts.map((
          post: Post,
        ): Item<ActionData> => ({
          word: `${post.id}`,
          display: post.title,
          action: {
            id: post.id,
            title: post.title,
            body: post.body,
            url: post.url,
          },
        }));

        controller.enqueue(items);

        controller.close();
      },
    });
  }

  params(): Params {
    return {};
  }
}
