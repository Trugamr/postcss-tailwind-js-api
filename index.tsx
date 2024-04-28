import postcss from "postcss";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { renderToStaticMarkup } from "react-dom/server";
import puppeteer from "puppeteer";

const css = `
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
`;

const processed = await postcss([
  autoprefixer,
  tailwindcss({
    content: ["index.tsx"],
  }),
]).process(css, {
  from: undefined,
});

function Greeting() {
  return (
    <div className="h-96 w-96 flex items-center justify-center flex-col gap-y-4 rounded-full bg-gradient-to-tr from-pink-200 to-blue-100 shadow-lg">
      <h1 className="p-4 border-dashed border-2 rounded border-black text-4xl font-bold">
        hello 👋
      </h1>
      <pre>{new Date().toLocaleString()}</pre>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <html className="h-full">
      <head>
        <style
          type="text/css"
          dangerouslySetInnerHTML={{ __html: processed.css }}
        />
      </head>
      <body className="flex items-center justify-center h-full">
        {children}
      </body>
    </html>
  );
}

const server = Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const markup = renderToStaticMarkup(
        <Shell>
          <Greeting />
        </Shell>
      );

      return new Response(markup, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    } else if (url.pathname === "/screenshot") {
      const markup = renderToStaticMarkup(
        <Shell>
          <Greeting />
        </Shell>
      );

      try {
        const browser = await puppeteer.launch();

        try {
          const page = await browser.newPage();
          await page.setContent(markup);
          const screenshot = await page.screenshot({
            type: "png",
            omitBackground: true,
          });

          return new Response(screenshot, {
            headers: {
              "Content-Type": "image/png",
            },
          });
        } catch (error) {
          return new Response("Failed to take screenshot", { status: 500 });
        } finally {
          await browser.close();
        }
      } catch (error) {
        return new Response("Failed to launch browser", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
