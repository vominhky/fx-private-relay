import { rest, RestHandler, RestRequest } from "msw";
import { CustomAliasData, RandomAliasData } from "../hooks/api/aliases";
import { ProfileData } from "../hooks/api/profile";
import { RuntimeData } from "../hooks/api/runtimeData";
import { mockIds, domainaddresses, profiles, relayaddresses } from "./mockData";

export function getHandlers(
  defaultMockId: null | typeof mockIds[number] = null
): RestHandler[] {
  const handlers: RestHandler[] = [];

  const getMockId = (req: RestRequest): typeof mockIds[number] | null => {
    const authHeader = req.headers.get("Authorization");
    if (typeof authHeader !== "string") {
      return defaultMockId;
    }
    const token = authHeader.split(" ")[1];
    return mockIds.find((mockId) => mockId === token) ?? defaultMockId;
  };

  const addGetHandler: (...args: Parameters<typeof rest.get>) => void = (
    path,
    resolver
  ) => {
    handlers.push(rest.get(path, resolver));
    handlers.push(rest.get(`http://127.0.0.1:8000${path}`, resolver));
  };
  const addPatchHandler: (...args: Parameters<typeof rest.patch>) => void = (
    path,
    resolver
  ) => {
    handlers.push(rest.patch(path, resolver));
    handlers.push(rest.patch(`http://127.0.0.1:8000${path}`, resolver));
  };
  const addPostHandler: (...args: Parameters<typeof rest.post>) => void = (
    path,
    resolver
  ) => {
    handlers.push(rest.post(path, resolver));
    handlers.push(rest.post(`http://127.0.0.1:8000${path}`, resolver));
  };
  const addDeleteHandler: (...args: Parameters<typeof rest.delete>) => void = (
    path,
    resolver
  ) => {
    handlers.push(rest.delete(path, resolver));
    handlers.push(rest.delete(`http://127.0.0.1:8000${path}`, resolver));
  };

  addGetHandler("/accounts/logout", (_req, res, ctx) => {
    return res();
  });
  addGetHandler("/api/v1/runtime_data", (_req, res, ctx) => {
    const runtimeData: RuntimeData = {
      FXA_ORIGIN: "https://example.com",
      GOOGLE_ANALYTICS_ID: "UA-123456789-0",
      PREMIUM_PRODUCT_ID: "prod_123456789",
      PREMIUM_PLANS: {
        country_code: "nl",
        plan_country_lang_mapping: {
          nl: {
            nl: {
              id: "price_1JmROfJNcmPzuWtR6od8OfDW",
              price: "€0,99",
            },
          },
        },
        premium_countries: ["nl"],
        premium_available_in_country: true,
      },
    };
    return res(ctx.status(200), ctx.json(runtimeData));
  });
  addGetHandler("/api/v1/users/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    return res(ctx.status(200), ctx.json([{ email: `${mockId}@example.com` }]));
  });
  addGetHandler("/accounts/profile/subdomain", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ available: true }));
  });
  addGetHandler("/api/v1/profiles/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    return res(ctx.status(200), ctx.json([profiles[mockId]]));
  });
  addPatchHandler("/api/v1/profiles/:id/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    const body = req.body as Partial<ProfileData>;
    profiles[mockId] = {
      ...profiles[mockId],
      ...body,
    };
    return res(ctx.status(200));
  });
  addGetHandler("/api/v1/relayaddresses/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    return res(ctx.status(200), ctx.json(relayaddresses[mockId]));
  });
  addPostHandler("/api/v1/relayaddresses/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    const body = req.body as Partial<RandomAliasData>;
    const ownAddresses = relayaddresses[mockId];
    const id = (ownAddresses[ownAddresses.length - 1]?.id ?? -1) + 1;
    ownAddresses.push({
      address: body.address ?? `random_${id}`,
      created_at: new Date(Date.now()).toISOString(),
      description: "",
      domain: 1,
      enabled: true,
      generated_for: "",
      id: id,
      last_modified_at: new Date(Date.now()).toISOString(),
      last_used_at: new Date(Date.now()).toISOString(),
      num_blocked: 0,
      num_forwarded: 0,
      num_spam: 0,
      type: "random",
    });
    return res(ctx.status(200));
  });
  addPatchHandler("/api/v1/relayaddresses/:id/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    const ownAddresses = relayaddresses[mockId];
    const index = ownAddresses.findIndex(
      (address) => address.id === Number.parseInt(req.params.id as string, 10)
    );
    if (index === -1) {
      return res(ctx.status(404));
    }
    const body = req.body as Partial<RandomAliasData>;
    ownAddresses[index] = {
      ...ownAddresses[index],
      ...body,
    };
    return res(ctx.status(200));
  });
  addDeleteHandler("/api/v1/relayaddresses/:id/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    const ownAddresses = relayaddresses[mockId];
    const index = ownAddresses.findIndex(
      (address) => address.id === Number.parseInt(req.params.id as string, 10)
    );
    if (index === -1) {
      return res(ctx.status(404));
    }
    ownAddresses.splice(index, 1);
    return res(ctx.status(200));
  });
  addGetHandler("/api/v1/domainaddresses/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    return res(ctx.status(200), ctx.json(domainaddresses[mockId]));
  });
  addPostHandler("/api/v1/domainaddresses/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    const body = req.body as Partial<CustomAliasData>;
    const ownAddresses = domainaddresses[mockId];
    const id = (ownAddresses[ownAddresses.length - 1]?.id ?? -1) + 1;
    ownAddresses.push({
      address: body.address ?? `custom_alias_${id}`,
      created_at: new Date(Date.now()).toISOString(),
      description: "",
      domain: 2,
      enabled: true,
      id: id,
      last_modified_at: new Date(Date.now()).toISOString(),
      last_used_at: new Date(Date.now()).toISOString(),
      num_blocked: 0,
      num_forwarded: 0,
      num_spam: 0,
      type: "custom",
    });
    return res(ctx.status(200));
  });
  addPatchHandler("/api/v1/domainaddresses/:id/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    const ownAddresses = domainaddresses[mockId];
    const index = ownAddresses.findIndex(
      (address) => address.id === Number.parseInt(req.params.id as string, 10)
    );
    if (index === -1) {
      return res(ctx.status(404));
    }
    const body = req.body as Partial<CustomAliasData>;
    ownAddresses[index] = {
      ...ownAddresses[index],
      ...body,
    };
    return res(ctx.status(200));
  });
  addDeleteHandler("/api/v1/domainaddresses/:id/", (req, res, ctx) => {
    const mockId = getMockId(req);
    if (mockId === null) {
      return res(ctx.status(400));
    }
    const ownAddresses = domainaddresses[mockId];
    const index = ownAddresses.findIndex(
      (address) => address.id === Number.parseInt(req.params.id as string, 10)
    );
    if (index === -1) {
      return res(ctx.status(404));
    }
    ownAddresses.splice(index, 1);
    return res(ctx.status(200));
  });

  return handlers;
}
export const handlers: RestHandler[] = getHandlers();
