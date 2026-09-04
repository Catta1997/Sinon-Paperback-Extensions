import {
  capitalLetter,
  getDebugMode,
  getDefLangGloablStatus,
  getDefLangStatus,
  getDisabledCustomLang,
  getDisabledCustomTags,
  getDisabledCustomUploader,
  getLanguages,
  tableFix,
} from "../utils";
import {
  ButtonRow,
  type Cookie,
  Form,
  FormConfirmationError,
  InputRow,
  LabelRow,
  Section,
  SelectRow,
  StepperRow,
  WebViewRow,
  NavigationRow,
  TriStateSelectRow,
  ToggleRow,
} from "@paperback/types";
import { mainRateLimiter } from "../network";
import { BASE_URL, loginManager, REQUIRE_LOGIN, sections } from "../main";
import { filterKeys, typeFilter } from "../models";

export class SettingsForm extends Form {
  onValueChangeLabelProxy = new Proxy(this, {
    has(target, p) {
      return typeof p === "string" && p.startsWith("onHandle_") ? true : Object.hasOwn(target, p);
    },

    get(target, p) {
      if (typeof p === "string" && p.startsWith("onHandle_")) {
        const rowId = p.slice("onHandle_".length);
        return async (value?: any) => {
          await target.onHandle(rowId, value);
        };
      }
      // @ts-ignore
      return target[p];
    },
  });
  userAgent: string = "";
  constructor(userAgent: string) {
    super();
    this.userAgent = userAgent;
  }
  override getSections() {
    const types: { id: string; title: string }[] = typeFilter.map((tag) => ({
      id: tag.id,
      title: tag.value,
    }));
    const languages: { id: string; title: string }[] = getLanguages().map((tag) => ({
      id: tag.id,
      title: `${tag.flag} ${tag.value}`,
    }));
    const inputSections = filterKeys.map((filter) =>
      InputRow(`${filter}`, {
        title: `${capitalLetter(filter)}`,
        value: ((Application.getState(`_${filter}`) as string | undefined) ?? "")
          .split(",")
          .filter(Boolean)
          .join(","),
        onValueChange: Application.Selector(
          this.onValueChangeLabelProxy,
          // @ts-expect-error
          `onHandle_${filter}`,
        ),
      }),
    );
    return [
      Section(
        {
          id: "account",
          header: "Account Settings",
        },
        [
          WebViewRow("loginRow", {
            title: "Login",
            request: {
              url: "https://e-hentai.org/bounce_login.php",
              method: "GET",
              headers: { "user-agent": this.userAgent },
            },
            isHidden: loginManager.isLoggedIn(),
            onComplete: Application.Selector(this as SettingsForm, "handleLogin"),
            onCancel: Application.Selector(this as SettingsForm, "handleLoginCancel"),
          }),
          LabelRow("logged", {
            title: "Logged in as",
            subtitle: `Account ID: ${
              (Application.getSecureState(`${BASE_URL}_username`) as string) ??
              loginManager.getAccountID()
            }`,
            isHidden: !loginManager.isLoggedIn(),
          }),
          ButtonRow("logout", {
            title: "Logout",
            isHidden: !loginManager.isLoggedIn(),
            onSelect: Application.Selector(this as SettingsForm, "handleLogoutButton"),
          }),
          ...(REQUIRE_LOGIN
            ? [
                LabelRow("loginInfo", {
                  title: "Warning",
                  subtitle: "Account must be at least 7-days old to work",
                }),
              ]
            : []),
        ],
      ),
      Section(
        {
          id: "update_settings",
          header: "Global Settings",
          footer: "Filter Settings",
        },
        [
          SelectRow("hide_type", {
            title: "Type",
            subtitle: "Affect search and sections",
            value: this.getHideTypeStatus(),
            layout: "list",
            items: types,
            minItemCount: 1,
            maxItemCount: types.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleHideTypeStatusChange"),
          }),
          StepperRow("rate_limit", {
            title: "Rate Limit",
            subtitle: "Set Custom Rate Limit",
            value: this.getRateFormsValue(),
            minValue: 1,
            maxValue: 100,
            stepValue: 1,
            loopOver: false,
            onValueChange: Application.Selector(this as SettingsForm, "handleRateStatusChange"),
          }),
          ToggleRow("custom_len", {
            title: "Languages",
            subtitle: "Disable custom filter for languages",
            value: getDisabledCustomLang(),
            isHidden: !loginManager.isLoggedIn(),
            onValueChange: Application.Selector(this as SettingsForm, "handleDisableCustomLan"),
          }),
          ToggleRow("custom_upl", {
            title: "Uploader",
            subtitle: "Disable custom filter for uploader",
            value: getDisabledCustomUploader(),
            isHidden: !loginManager.isLoggedIn(),
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleDisableCustomUploader",
            ),
          }),
          ToggleRow("custom_tags", {
            title: "Tags",
            subtitle: "Disable custom filter for tags",
            value: getDisabledCustomTags(),
            isHidden: !loginManager.isLoggedIn(),
            onValueChange: Application.Selector(this as SettingsForm, "handleDisableCustomTags"),
          }),
        ],
      ),
      Section(
        {
          id: "table_fix_section",
          header: "Account Settings",
        },
        [
          ButtonRow("table_fix", {
            title: "Fix Table Issue",
            isHidden: !tableFix.needTableFix,
            onSelect: Application.Selector(this as SettingsForm, "handleTableFix"),
          }),
          LabelRow("table_fix_label", {
            title: `Table fix is not needed`,
            isHidden: tableFix.needTableFix,
          }),
        ],
      ),
      Section(
        {
          id: "sections_section",
          header: "Sections",
        },
        [
          TriStateSelectRow("def_languages", {
            title: "Languages",
            subtitle: "This settings will not be applied to 'Popular' and 'Favorite' Sections",
            value: getDefLangGloablStatus(),
            layout: "list",
            items: languages,
            allowExclusion: true,
            allowEmptySelection: false,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleDefLangGlobalStatusChange",
            ),
          }),
          ToggleRow("emptyFavorite", {
            value: false,
            title: "Hide favorite sections with 0 elements",
            subtitle:
              "If this is enabled, on Favorite section you will see `Favorite` with 0 elements",
            onValueChange: Application.Selector(this as SettingsForm, "handleEmptyFavorite"),
          }),
          NavigationRow("sectionOrder", {
            title: "Sections Order",
            form: sections.getSettings(),
          }),
        ],
      ),
      Section(
        {
          id: "default_value",
          header: "Default Search Filter",
        },
        [
          TriStateSelectRow("def_languages", {
            title: "Language",
            value: getDefLangStatus(),
            layout: "list",
            items: languages,
            allowExclusion: true,
            allowEmptySelection: false,
            maximum: languages.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleDefLangStatusChange"),
          }),
          ...inputSections,
        ],
      ),
      Section(
        {
          id: "debug_section",
          header: "Debug",
        },
        [
          ToggleRow("debug_toggle", {
            title: "DEBUG",
            value: getDebugMode(),
            subtitle: "WARNING: turn debug on will make extension log a lot",
            onValueChange: Application.Selector(this as SettingsForm, "handleDebugMode"),
          }),
        ],
      ),
    ];
  }
  public async updateValue<T>(value: T, filter: string): Promise<void> {
    Application.setState(value, filter);
    this.reloadForm();
  }

  getHideTypeStatus(): string[] {
    return (
      (Application.getState("_type") as string[] | undefined) ?? [
        "1",
        "2",
        "4",
        "8",
        "16",
        "32",
        "64",
        "128",
        "256",
        "512",
      ]
    );
  }

  async handleLogin(cookies: Cookie[]): Promise<void> {
    await loginManager.logIn(cookies);
    Application.invalidateDiscoverSections();
    this.reloadForm();
    return;
  }

  async handleLoginCancel(): Promise<void> {
    this.reloadForm();
    return;
  }

  async handleLogoutButton(): Promise<void> {
    throw new FormConfirmationError(
      Application.Selector(this as SettingsForm, "handleLogoutConfirm"),
      "Do you want to logout?",
    );
  }

  async handleLogoutConfirm() {
    loginManager.logOut();
    this.reloadForm();
  }

  async handleDefLangGlobalStatusChange(
    value: Record<string, "included" | "excluded">,
  ): Promise<void> {
    const previous = getDefLangGloablStatus() ?? { all: "included" };
    if (value.all === "excluded") {
      value.all = "included";
    }
    const hadAll = previous.all === "included";
    const hasAll = value.all === "included";
    if (!hadAll && hasAll) {
      value = { all: "included" };
    } else if (hadAll && hasAll && Object.keys(value).length > 1) {
      delete value.all;
    }
    if (Object.keys(value).length === 0) {
      value = { all: "included" };
    }
    await this.updateValue(value, "_globalLanguages");
  }

  async handleDefLangStatusChange(value: Record<string, "included" | "excluded">): Promise<void> {
    const previous = getDefLangStatus() ?? { all: "included" };
    if (value.all === "excluded") {
      value.all = "included";
    }
    const hadAll = previous.all === "included";
    const hasAll = value.all === "included";
    if (!hadAll && hasAll) {
      value = { all: "included" };
    } else if (hadAll && hasAll && Object.keys(value).length > 1) {
      delete value.all;
    }
    if (Object.keys(value).length === 0) {
      value = { all: "included" };
    }
    await this.updateValue(value, "_languages");
  }

  async handleHideTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_type");
  }

  async onHandle(type: string, value: string): Promise<void> {
    await this.updateValue(value, `_${type}`);
  }

  getRateFormsValue(): number {
    return (
      (Application.getState("RateFilter") as number | undefined) ??
      mainRateLimiter.options.numberOfRequests.valueOf()
    );
  }

  async handleRateStatusChange(value: number): Promise<void> {
    await this.updateValue(value, "RateFilter");
    mainRateLimiter.options.numberOfRequests = value;
  }

  async handleDisableCustomLan(value: boolean): Promise<void> {
    await this.updateValue(value, "_custom_lang");
  }

  async handleDisableCustomUploader(value: boolean): Promise<void> {
    await this.updateValue(value, "_custom_upl");
  }

  async handleDisableCustomTags(value: boolean): Promise<void> {
    await this.updateValue(value, "_custom_tags");
  }

  async handleDebugMode(value: boolean): Promise<void> {
    await this.updateValue(value, "_debug");
  }

  async handleEmptyFavorite(value: boolean): Promise<void> {
    await this.updateValue(value, "_emptyFav");
  }

  async handleTableFix(): Promise<void> {
    throw new FormConfirmationError(
      Application.Selector(this as SettingsForm, "handleTableFixConfirm"),
      "Do you want to fix table view? WARNING: this will change your account `display mode` preferences",
    );
  }

  async handleTableFixConfirm() {
    await Application.scheduleRequest({ url: `${BASE_URL}/?inline_set=dm_e`, method: "GET" });
    tableFix.needTableFix = false;
    this.reloadForm();
    Application.invalidateDiscoverSections();
  }
}
