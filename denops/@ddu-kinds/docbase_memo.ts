import { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v2.5.0/base/kind.ts";
import {
  ActionArguments,
  ActionFlags,
  BaseKind,
  Previewer,
} from "https://deno.land/x/ddu_vim@v2.5.0/types.ts";
import {
  open,
  replace,
} from "https://deno.land/x/denops_std@v4.1.8/buffer/mod.ts";
import { setbufvar } from "https://deno.land/x/denops_std@v4.1.8/function/mod.ts";
import { format } from "https://deno.land/x/denops_std@v4.1.8/bufname/mod.ts";
import type { Bufname } from "https://deno.land/x/denops_std@v4.1.8/bufname/mod.ts";
import { group } from "https://deno.land/x/denops_std@v4.1.8/autocmd/mod.ts";

export type ActionData = {
  id: number;
  title: string;
  body: string;
};

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  actions: Record<
    string,
    (args: ActionArguments<Params>) => Promise<ActionFlags>
  > = {
    edit: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const action = args.items[0].action as ActionData;
      const bufName: Bufname = {
        scheme: "ddu",
        expr: `kind/docbase_memo/edit/${action.id}.md`,
        params: {
          id: `${action.id}`,
          title: action.title,
        },
      };
      const result = await open(args.denops, format(bufName));

      await setbufvar(args.denops, result.bufnr, "&buftype", "acwrite");
      await setbufvar(args.denops, result.bufnr, "&filetype", "markdown");
      await setbufvar(args.denops, result.bufnr, "&swapfile", false);
      await replace(args.denops, result.bufnr, action.body.split(/\r?\n/));

      await group(args.denops, "DduKindDocbaseMemoEdit", (helper) => {
        helper.define(
          "BufWriteCmd",
          format(bufName),
          `call denops#request("ddu-source-docbase", "pushBuffer", ["${
            format(bufName)
          }"])`,
        );
      });

      return ActionFlags.None;
    },
  };

  getPreviewer(
    args: GetPreviewerArguments,
  ): Promise<Previewer | undefined> {
    const action = args.item.action as ActionData;

    return Promise.resolve({
      kind: "nofile",
      contents: action.body.split(/\r?\n/),
    });
  }

  params(): Params {
    return {};
  }
}
