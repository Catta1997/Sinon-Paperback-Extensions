import {
  capitalLetter,
  getDefaultArtist,
  getDefaultCharacter,
  getDefaultCosplayer,
  getDefaultFemale,
  getDefaultGroup,
  getDefaultMale,
  getDefaultMixed,
  getDefaultOther,
  getDefaultParody,
  getDefLangGloablStatus,
  getDefLangStatus,
  getLanguages,
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
  EditSection,
} from "@paperback/types";
import { mainRateLimiter } from "../network";
import { BASE_URL, loginManager, REQUIRE_LOGIN, sections } from "../main";
import { type FilterKey, filterKeys, languageAll, typeFilter } from "../models";

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
            subtitle:
              (Application.getSecureState(`${BASE_URL}_username`) as string) ??
              loginManager.getAccountID(),
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
            title: "Contents",
            subtitle: "content type, affect search and sections",
            value: this.getHideTypeStatus(),
            layout: "list",
            items: types,
            minItemCount: 1,
            maxItemCount: types.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleHideTypeStatusChange"),
          }),
          SelectRow("def_languages", {
            title: "Languages for Sections",
            subtitle: "This settings will not be applied to 'Popular' and 'Favorite' Sections",
            value: getDefLangGloablStatus(),
            layout: "list",
            items: languages,
            minItemCount: 0,
            maxItemCount: languages.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleDefLangGlobalStatusChange",
            ),
          }),
          StepperRow("rate_limit", {
            title: "Rate Limit",
            subtitle: "Set Custom Rate Limit",
            value: this.getRateFormsValue(),
            minValue: 5,
            maxValue: 100,
            stepValue: 1,
            loopOver: false,
            onValueChange: Application.Selector(this as SettingsForm, "handleRateStatusChange"),
          }),
        ],
      ),
      Section(
        {
          id: "sections_section",
          header: "Section Order",
        },
        [
          NavigationRow("sectionOrder", {
            title: "Sections Order",
            subtitle: "Sections Order",
            form: sections.getSettings(),
          }),
        ],
      ),
      Section(
        {
          id: "default_value",
          footer: "Separate filters with `,`",
          header: "Default Search Filter",
        },
        [
          SelectRow("def_languages", {
            title: "Language",
            value: getDefLangStatus(),
            layout: "list",
            items: languages,
            minItemCount: 0,
            maxItemCount: languages.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleDefLangStatusChange"),
          }),
          ...inputSections,
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
  async handleDefLangGlobalStatusChange(value: string[]): Promise<void> {
    if (value.length > 0) {
      value = value.filter((t) => t !== "all");
    }
    if (value.length === languageAll.length) {
      value = ["all"];
    }
    await this.updateValue(value, "_globalLanguages");
  }
  async handleDefLangStatusChange(value: string[]): Promise<void> {
    if (value.length > 0) {
      value = value.filter((t) => t !== "all");
    }
    if (value.length === languageAll.length) {
      value = ["all"];
    }
    await this.updateValue(value, "_languages");
  }
  async handleHideTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_type");
  }
  async handleDefaultCharacterChange(value: string): Promise<void> {
    await this.updateValue(value, "_character");
  }
  async handleDefaultFemaleChange(value: string): Promise<void> {
    await this.updateValue(value, "_female");
  }
  async handleDefaultMaleChange(value: string): Promise<void> {
    await this.updateValue(value, "_male");
  }
  async handleDefaultOtherChange(value: string): Promise<void> {
    await this.updateValue(value, "_other");
  }
  async handleDefaultParodyChange(value: string): Promise<void> {
    await this.updateValue(value, "_parody");
  }
  async handleDefaultArtistChange(value: string): Promise<void> {
    await this.updateValue(value, "_artist");
  }
  async handleDefaultMixedChange(value: string): Promise<void> {
    await this.updateValue(value, "_mixed");
  }
  async handleDefaultCosplayerChange(value: string): Promise<void> {
    await this.updateValue(value, "_cosplayer");
  }
  async handleDefaultGroupChange(value: string): Promise<void> {
    await this.updateValue(value, "_group");
  }
  async onHandle(type: string, value: string): Promise<void> {
    console.log(type);
    console.log(value);
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
}
