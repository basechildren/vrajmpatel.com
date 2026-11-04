import assert from "node:assert/strict";
import { posix } from "node:path";
import test from "node:test";
import { animatedNavigation, getNavigationCommand } from "../src/lib/siteNavigation.ts";

test("header commands describe sibling, parent, child, and current-page navigation", () => {
  assert.equal(getNavigationCommand("/brief", "/about"), "cd ../about");
  assert.equal(getNavigationCommand("/projects/operational-ticket-intelligence", "/projects"), "cd ..");
  assert.equal(getNavigationCommand("/", "/about"), "cd about");
  assert.equal(getNavigationCommand("/projects/operational-ticket-intelligence", "/about"), "cd ~/about");
  assert.equal(getNavigationCommand("/unknown/nested/path", "/experience"), "cd ~/experience");
  assert.equal(getNavigationCommand("/about/", "/about"), "cd .");
});

test("home always displays cd ~, including when already home", () => {
  for (const current of ["/", "/projects", "/about", "/projects/operational-ticket-intelligence"]) {
    assert.equal(getNavigationCommand(current, "/"), "cd ~");
  }
});

test("every displayed command resolves to its actual link destination from every page depth", () => {
  const locations = ["/", "/projects", "/projects/operational-ticket-intelligence", "/brief", "/about/", "/privacy", "/unknown/nested/path"];
  for (const current of locations) {
    for (const { path } of animatedNavigation) {
      const command = getNavigationCommand(current, path);
      const argument = command.slice(3);
      const destination = argument === "~" ? "/" : argument.startsWith("~/") ? posix.resolve("/", argument.slice(2)) : posix.resolve(current, argument);
      assert.equal(destination, path.replace(/\/$/, "") || "/", `${current} → ${path}: ${command}`);
    }
  }
});
