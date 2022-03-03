import React from "react";
import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { styled, getCssText } from "../stitches.config";

const Body = styled('body', {
  background: "$sand",
})

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head>
          <style
            id="stitches"
            // https://stitches.dev/docs/server-side-rendering
            dangerouslySetInnerHTML={{ __html: getCssText() }}
          />
        </Head>
        <Body>
          <Main />
          <NextScript />
        </Body>
      </Html>
    );
  }
}
