from mcp.server.fastmcp import FastMCP
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, LLMConfig
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai import CacheMode
from crawl4ai import JsonCssExtractionStrategy
from crawl4ai import AsyncWebCrawler, AdaptiveCrawler, AdaptiveConfig

mcp = FastMCP("webcrawl")

mcp.settings.port = 8002


# @mcp.tool()
# async def scrape_url(url: str) -> str:
#     """
#     Scrape a webpage and return its content.
#     Args:
#         url: The URL of the webpage to scrape
#     Returns:
#         The webpage content in markdown format
#     """
#     try:
#         async with AsyncWebCrawler() as crawler:
#             result = await crawler.arun(url=url)
#             return result.markdown.raw_markdown if result.markdown else "No content found"
#     except Exception as e:
#         return f"Error scraping URL: {str(e)}"
# @mcp.tool()
# async def scrape_url_text(url: str) -> str:
#     """
#     Scrape a webpage and return only the text.
#     """
#     schema = {
#         "name": "Example Items",
#         "baseSelector": "div.item",
#         "fields": [
#             {"name": "title", "selector": "h2"},
#             {"name": "link", "selector": "a"}
#         ]
#     }
#     print("scrape text")
#     try:
#         async with AsyncWebCrawler() as crawler:
#             result = await crawler.arun(
#                 url=url,
#                 config=CrawlerRunConfig(
#                     cache_mode=CacheMode.BYPASS,
#                     extraction_strategy=JsonCssExtractionStrategy(schema)
#                 )
#             )

#             if not result.extracted_content:
#                 return "No content found"

#             data = json.loads(result.extracted_content)
#             print(data)
#             return str(data)

#     except Exception as e:
#         return f"Error scraping URL: {str(e)}"

# @mcp.tool()
# async def scrape_url(url: str) -> str:
#     """
#     Scrape a webpage and return its content.
    
#     Args:
#         url: The URL of the webpage to scrape
        
#     Returns:
#         The webpage content in markdown format
#     """
#     try:
#         md_generator = DefaultMarkdownGenerator(
#             options={
#                 "ignore_images": True,
#                 "ignore_links": True,
#                 "body_width": 80
#             }
#         )

#         config = CrawlerRunConfig(
#             markdown_generator=md_generator
#         )
#         async with AsyncWebCrawler() as crawler:
#             result = await crawler.arun(url=url, config=config)
#             return result.markdown.raw_markdown if result.markdown else "No content found"
#     except Exception as e:
#         return f"Error scraping URL: {str(e)}"

@mcp.tool()
async def adaptive_crawling(url: str, query:str) -> str:
    """
    Adaptive Web Crawling tool, call this tools only once as it bring data from more pages

    Query Formulation:
        Use specific, descriptive queries
        Include key terms you expect to find
        Avoid overly broad queries


    Args:
        url: The URL of the webpage to scrape
        query: a query for content search



    Returns:
        str: Summary of relevant crawled content
    """
    try:
        md_generator = DefaultMarkdownGenerator(
            options={
                "ignore_images": True,
                "ignore_links": True,
                "body_width": 80
            }
        )


        async with AsyncWebCrawler(markdown_generator=md_generator) as crawler:
            # Config 
            config = AdaptiveConfig(
                confidence_threshold=0.5, # when to stop
                max_pages=20,  # max pages
                top_k_links=5  # link per page
            )

            adaptive = AdaptiveCrawler(crawler, config)
            print(url,query)
            result = await adaptive.digest(
                start_url=url,
                query=query
            )

            # irelevant query: 
            if result.metrics.get('is_irrelevant', False):
                print("Query is unrelated to the page!")
            
            adaptive.print_stats()

            pages = adaptive.get_relevant_content(top_k=5) # max nr of pages

            if not pages:
                return "No relevant content found."
            print(f"Found {len(pages)} pages.")
            # Format output
            output = []
            for p in pages:
                print(p)
                output.append(
                    f"URL: {p['url']}\nScore: {p['score']:.2f}\nContent: {p['content']}\n"
                )

            return "\n".join(output)

    except Exception as e:
        return f"Error scraping URL: {str(e)}"


if __name__ == "__main__":
    mcp.run(transport="sse")
