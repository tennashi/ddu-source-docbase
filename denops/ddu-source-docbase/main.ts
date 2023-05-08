import { Denops } from "https://deno.land/x/denops_std@v4.1.8/mod.ts";
import {
  assertNumber,
  assertString,
} from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import { parse } from "https://deno.land/x/denops_std@v4.1.8/bufname/mod.ts";
import {
  bufnr,
  getbufline,
  setbufvar,
} from "https://deno.land/x/denops_std@v4.1.8/function/mod.ts";
import { globals } from "https://deno.land/x/denops_std@v4.1.8/variable/mod.ts";
import ky from "https://esm.sh/ky@0.33.3";

import { sleep } from "https://deno.land/x/sleep/mod.ts";

export async function main(denops: Denops): Promise<void> {
  const apiToken = await globals.get(
    denops,
    "ddu#source#docbase#api_token",
    "",
  );
  if (apiToken === "") {
    console.error("g:ddu#source#docbase#api_token must be set");
    return;
  }

  const teamName = await globals.get(
    denops,
    "ddu#source#docbase#team_name",
    "",
  );
  if (teamName === "") {
    console.error("g:ddu#source#docbase#team_name must be set");
    return;
  }

  denops.dispatcher = {
    async pushBuffer(bufName: unknown): Promise<void> {
      assertString(bufName);

      const bufNumber = await bufnr(denops, bufName);
      const lines = await getbufline(denops, bufNumber, 1, "$");

      const buf = parse(bufName);
      await ky.patch(
        `https://api.docbase.io/teams/${teamName}/posts/${buf.params?.id}`,
        {
          json: {
            body: lines.join("\n"),
          },
          headers: {
            "X-DocBaseToken": apiToken,
            "Content-Type": "application/json",
          },
        },
      );
      await setbufvar(denops, bufNumber, "&modified", 0);
    },

    async createMemo(title: unknown): Promise<void> {
      assertString(title);

      await ky.post(
        `https://api.docbase.io/teams/${teamName}/posts`,
        {
          json: {
            title: title,
            body: "",
            draft: true,
          },
          headers: {
            "X-DocBaseToken": apiToken,
            "Content-Type": "application/json",
          },
        },
      );

      await sleep(1);
    },

    async deleteMemo(id: unknown): Promise<void> {
      assertNumber(id);

      await ky.delete(
        `https://api.docbase.io/teams/${teamName}/posts/${id}`,
        {
          headers: {
            "X-DocBaseToken": apiToken,
            "Content-Type": "application/json",
          },
        },
      );

      await sleep(1);
    },
  };
}
