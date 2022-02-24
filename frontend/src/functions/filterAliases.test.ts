import { it, expect } from "@jest/globals";
import { getMockProfileData } from "../../__mocks__/hooks/api/profile";
import {
  AliasData,
  CustomAliasData,
  RandomAliasData,
} from "../hooks/api/aliases";
import { ProfileData } from "../hooks/api/profile";
import { filterAliases, Filters } from "./filterAliases";

const getMockedAliasMatching = (filters: Partial<Filters>): AliasData => {
  const alias = {
    address: filters.string ?? "arbitrary_string",
    created_at: "2021-11-08T13:46:40.899003Z",
    description: "",
    domain: 2,
    block_list_emails: filters.status === "promo-blocking",
    enabled: filters.status !== "blocking",
    id: 42,
    last_modified_at: "2021-11-08T13:46:40.899003Z",
    last_used_at: null,
    num_blocked: 0,
    num_forwarded: 0,
    num_spam: 0,
    type: "custom",
  } as CustomAliasData | RandomAliasData;
  if (filters.domainType === "random") {
    (alias as RandomAliasData).generated_for = "";
    (alias as RandomAliasData).type = "random";
  }
  return alias;
};
const getOneOfEvery = (): AliasData[] => {
  return [
    getMockedAliasMatching({
      string: "some_string",
      domainType: "custom",
      status: "blocking",
    }),
    getMockedAliasMatching({
      string: "other_string",
      domainType: "custom",
      status: "blocking",
    }),
    getMockedAliasMatching({
      string: "some_string",
      domainType: "random",
      status: "blocking",
    }),
    getMockedAliasMatching({
      string: "other_string",
      domainType: "random",
      status: "blocking",
    }),
    getMockedAliasMatching({
      string: "some_string",
      domainType: "custom",
      status: "promo-blocking",
    }),
    getMockedAliasMatching({
      string: "other_string",
      domainType: "custom",
      status: "promo-blocking",
    }),
    getMockedAliasMatching({
      string: "some_string",
      domainType: "random",
      status: "promo-blocking",
    }),
    getMockedAliasMatching({
      string: "other_string",
      domainType: "random",
      status: "promo-blocking",
    }),
    getMockedAliasMatching({
      string: "some_string",
      domainType: "custom",
      status: "forwarding",
    }),
    getMockedAliasMatching({
      string: "other_string",
      domainType: "custom",
      status: "forwarding",
    }),
    getMockedAliasMatching({
      string: "some_string",
      domainType: "random",
      status: "forwarding",
    }),
    getMockedAliasMatching({
      string: "other_string",
      domainType: "random",
      status: "forwarding",
    }),
  ];
};

const getMockedProfile = (subdomain = "arbitrary_subdomain"): ProfileData => {
  return getMockProfileData({
    has_premium: true,
    subdomain: subdomain,
  });
};

it("returns all aliases if no filters are active", () => {
  const aliases = getOneOfEvery();
  const profile = getMockedProfile();

  expect(filterAliases(aliases, profile, { string: "" })).toStrictEqual(
    aliases
  );
});

it("filters out aliases that do not match the given string", () => {
  const aliases = [
    getMockedAliasMatching({ string: "some_string" }),
    getMockedAliasMatching({ string: "other_string" }),
  ];
  const profile = getMockedProfile();

  expect(filterAliases(aliases, profile, { string: "some" })).toStrictEqual([
    aliases[0],
  ]);
});

it("can match on an alias's subdomain when using a string filter", () => {
  const aliases = [
    getMockedAliasMatching({ domainType: "random" }),
    getMockedAliasMatching({ domainType: "custom" }),
  ];
  const profile = getMockedProfile("some_domain");

  expect(filterAliases(aliases, profile, { string: "some" })).toStrictEqual([
    aliases[1],
  ]);
});

it("can filter out non-random domains", () => {
  const aliases = [
    getMockedAliasMatching({ domainType: "random" }),
    getMockedAliasMatching({ domainType: "custom" }),
  ];
  const profile = getMockedProfile();

  expect(
    filterAliases(aliases, profile, { string: "", domainType: "random" })
  ).toStrictEqual([aliases[0]]);
});

it("can filter out non-random domains", () => {
  const aliases = [
    getMockedAliasMatching({ domainType: "random" }),
    getMockedAliasMatching({ domainType: "custom" }),
  ];
  const profile = getMockedProfile();

  expect(
    filterAliases(aliases, profile, { string: "", domainType: "custom" })
  ).toStrictEqual([aliases[1]]);
});

it("can filter out blocking aliases", () => {
  const aliases = [
    getMockedAliasMatching({ status: "blocking" }),
    getMockedAliasMatching({ status: "promo-blocking" }),
    getMockedAliasMatching({ status: "forwarding" }),
  ];
  const profile = getMockedProfile();

  expect(
    filterAliases(aliases, profile, { string: "", status: "forwarding" })
  ).toStrictEqual([aliases[2]]);
});

it("can filter out aliases that are blocking promotional emails", () => {
  const aliases = [
    getMockedAliasMatching({ status: "blocking" }),
    getMockedAliasMatching({ status: "promo-blocking" }),
    getMockedAliasMatching({ status: "forwarding" }),
  ];
  const profile = getMockedProfile();

  expect(
    filterAliases(aliases, profile, { string: "", status: "promo-blocking" })
  ).toStrictEqual([aliases[1]]);
});

it("can filter out forwarding aliases", () => {
  const aliases = [
    getMockedAliasMatching({ status: "blocking" }),
    getMockedAliasMatching({ status: "promo-blocking" }),
    getMockedAliasMatching({ status: "forwarding" }),
  ];
  const profile = getMockedProfile();

  expect(
    filterAliases(aliases, profile, { string: "", status: "blocking" })
  ).toStrictEqual([aliases[0]]);
});

it("can combine filters", () => {
  const aliases = [
    getMockedAliasMatching({ string: "some_string", status: "blocking" }),
    getMockedAliasMatching({ string: "some_string", status: "promo-blocking" }),
    getMockedAliasMatching({ string: "some_string", status: "forwarding" }),
    getMockedAliasMatching({ string: "other_string", status: "blocking" }),
    getMockedAliasMatching({
      string: "other_string",
      status: "promo-blocking",
    }),
    getMockedAliasMatching({ string: "other_string", status: "forwarding" }),
  ];
  const profile = getMockedProfile();

  expect(
    filterAliases(aliases, profile, { string: "some", status: "forwarding" })
  ).toStrictEqual([aliases[2]]);
});
