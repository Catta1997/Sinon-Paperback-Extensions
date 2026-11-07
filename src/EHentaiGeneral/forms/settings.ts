import {
  capitalLetter,
  getDebugMode,
  getDefLangGlobalStatus,
  getDefLangStatus,
  getDisabledCustomLang,
  getDisabledCustomTags,
  getDisabledCustomUploader,
  getLanguageOptions,
  getStateList,
  getTypeOptions,
  type LanguageStatus,
  normalizeLanguageSelection,
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
    const types = getTypeOptions();
    const languages = getLanguageOptions();
    const inputSections = filterKeys.map((filter) =>
      InputRow(`${filter}`, {
        title: `${capitalLetter(filter)}`,
        value: getStateList(filter).join(","),
        onValueChange: this.bind(filter),
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
            onValueChange: this.bind("type"),
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
            onValueChange: this.bind("custom_lang"),
          }),
          ToggleRow("custom_upl", {
            title: "Uploader",
            subtitle: "Disable custom filter for uploader",
            value: getDisabledCustomUploader(),
            isHidden: !loginManager.isLoggedIn(),
            onValueChange: this.bind("custom_upl"),
          }),
          ToggleRow("custom_tags", {
            title: "Tags",
            subtitle: "Disable custom filter for tags",
            value: getDisabledCustomTags(),
            isHidden: !loginManager.isLoggedIn(),
            onValueChange: this.bind("custom_tags"),
          }),
        ],
      ),
      Section(
        {
          id: "table_fix_section",
          header: "Table Fix",
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
          TriStateSelectRow("def_languages_global", {
            title: "Languages",
            subtitle: "This settings will not be applied to 'Popular' and 'Favorite' Sections",
            value: getDefLangGlobalStatus(),
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
            onValueChange: this.bind("emptyFav"),
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
            onValueChange: this.bind("debug"),
          }),
        ],
      ),
    ];
  }

  /** Selector that stores the new value in the app state under `_${key}` (see onHandle). */
  private bind(key: string): any {
    // @ts-expect-error the dynamic `onHandle_*` selector is resolved by onValueChangeLabelProxy
    return Application.Selector(this.onValueChangeLabelProxy, `onHandle_${key}`);
  }

  public async updateValue<T>(value: T, filter: string): Promise<void> {
    Application.setState(value, filter);
    this.reloadForm();
  }

  getHideTypeStatus(): string[] {
    return (Application.getState("_type") as string[] | undefined) ?? typeFilter.map((t) => t.id);
  }

  async handleLogin(cookies: Cookie[]): Promise<void> {
    await loginManager.logIn(cookies); // also invalidates the discover sections
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

  async handleDefLangGlobalStatusChange(value: LanguageStatus): Promise<void> {
    await this.updateValue(
      normalizeLanguageSelection(getDefLangGlobalStatus(), value),
      "_globalLanguages",
    );
  }

  async handleDefLangStatusChange(value: LanguageStatus): Promise<void> {
    await this.updateValue(normalizeLanguageSelection(getDefLangStatus(), value), "_languages");
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
