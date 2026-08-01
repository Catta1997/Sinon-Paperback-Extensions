import {
  getDefaultArtist,
  getDefaultCharacter,
  getDefaultCosplayer,
  getDefaultFemale,
  getDefaultGroup,
  getDefaultMale,
  getDefaultMixed,
  getDefaultOther,
  getDefaultParody,
  getDefLangStatus,
  languageAll,
  typeFilter,
} from "../utils";
import {
  ButtonRow,
  CloudflareError,
  type Cookie,
  Form,
  FormConfirmationError,
  InputRow,
  LabelRow,
  Section,
  SelectRow,
  StepperRow,
  WebViewRow,
} from "@paperback/types";
import { mainRateLimiter } from "../network";
import { BASE_URL, loginManager, REQUIRE_LOGIN } from "../main";

export class SettingsForm extends Form {
  override getSections() {
    const types: { id: string; title: string }[] = typeFilter.map((tag) => ({
      id: tag.id,
      title: tag.value,
    }));
    const languages: { id: string; title: string }[] = languageAll.map((tag) => ({
      id: tag.id,
      title: `${tag.flag} ${tag.value}`,
    }));
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
            subtitle: "Default value for content type, affect search and sections",
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
          id: "default_value",
          footer: "Separate filters with `,`",
          header: "Default Search Filter",
        },
        [
          SelectRow("def_languages", {
            title: "Default Languages",
            subtitle: "Default languages",
            value: getDefLangStatus(),
            layout: "list",
            items: languages,
            minItemCount: 0,
            maxItemCount: languages.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleDefLangStatusChange"),
          }),
          InputRow("character", {
            title: "Default value for `character` filter",
            value: getDefaultCharacter().join(","),
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleDefaultCharacterChange",
            ),
          }),
          InputRow("male", {
            title: "Default value for `male` filter",
            value: getDefaultMale().join(","),
            onValueChange: Application.Selector(this as SettingsForm, "handleDefaultMaleChange"),
          }),
          InputRow("female", {
            title: "Default value for `female` filter",
            value: getDefaultFemale().join(","),
            onValueChange: Application.Selector(this as SettingsForm, "handleDefaultFemaleChange"),
          }),
          InputRow("other", {
            title: "Default value for `other` filter",
            value: getDefaultOther().join(","),
            onValueChange: Application.Selector(this as SettingsForm, "handleDefaultOtherChange"),
          }),
          InputRow("parody", {
            title: "Default value for `parody` filter",
            value: getDefaultParody().join(","),
            onValueChange: Application.Selector(this as SettingsForm, "handleDefaultParodyChange"),
          }),
          InputRow("artist", {
            title: "Default value for `artist` filter",
            value: getDefaultArtist().join(","),
            onValueChange: Application.Selector(this as SettingsForm, "handleDefaultArtistChange"),
          }),
          InputRow("mixed", {
            title: "Default value for `mixed` filter",
            value: getDefaultMixed().join(","),
            onValueChange: Application.Selector(this as SettingsForm, "handleDefaultMixedChange"),
          }),
          InputRow("cosplayer", {
            title: "Default value for `cosplayer` filter",
            value: getDefaultCosplayer().join(","),
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleDefaultCosplayerChange",
            ),
          }),
          InputRow("group", {
            title: "Default value for `group` filter",
            value: getDefaultGroup().join(","),
            onValueChange: Application.Selector(this as SettingsForm, "handleDefaultGroupChange"),
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
  }

  async handleLoginCancel(): Promise<void> {
    this.reloadForm();
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

  async handleDefLangStatusChange(value: string[]): Promise<void> {
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
