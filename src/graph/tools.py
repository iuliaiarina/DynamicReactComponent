from datetime import datetime
import logging
import re
from pathlib import Path
from langchain_core.tools import tool
from tavily import TavilyClient
from src.utils.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@tool
def internet_search_tool(query: str) -> str:
    """Search the internet for information using Tavily API."""
    logger.info(f"Searching for: {query}")
    client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    results =  client.search(
            query,
            max_results= 5,
            include_raw_content=False,
            topic="general",
    )
    print(f"Search results retrieved")

    formatted = f"Search Results for '{query}':\n\n"

    if results.get("results"):
        for idx, result in enumerate(results["results"], 1):
            formatted += f"{idx}. {result['title']}\n"
            formatted += f"   URL: {result['url']}\n"
            formatted += f"   Content: {result['content']}\n"
            formatted += f"   Relevance Score: {result['score']:.2f}\n\n"
        logger.info(f"Retrieved {len(results['results'])} results")
    else:
        formatted += "No results found."

    return formatted


@tool
def get_time_and_date() -> str:
    """Get the current date and time."""
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")


@tool
def load_skill(skill_name: str) -> str:
    """Load a specialized skill prompt.

    Available skills:
    1.name: aboutyou
     description: Provide the assistant's name when the user asks for it.

    Returns the skill's prompt and context.
    """
    requested_name = (skill_name or "").strip()
    if not requested_name:
        return "No skill name provided."

    if not re.fullmatch(r"[A-Za-z0-9_-]+", requested_name):
        return (
            "Invalid skill name. Use only letters, numbers, underscores, and hyphens."
        )

    skills_root = Path(__file__).resolve().parents[1] / "skills"
    skill_file = skills_root / requested_name / "SKILL.md"

    if not skill_file.exists():
        available_skills = sorted(
            path.name
            for path in skills_root.iterdir()
            if path.is_dir() and (path / "SKILL.md").exists()
        )
        if available_skills:
            return (
                f"Skill '{requested_name}' not found. "
                f"Available skills: {', '.join(available_skills)}"
            )
        return f"Skill '{requested_name}' not found and no skills are currently available."

    try:
        skill = skill_file.read_text(encoding="utf-8").strip()
    except OSError as exc:
        logger.exception("Failed to load skill '%s'", requested_name)
        return f"Failed to load skill '{requested_name}': {exc}"

    logger.info("Loaded skill '%s' from %s", requested_name, skill_file)
    return skill



