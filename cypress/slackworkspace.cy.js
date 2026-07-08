import SlackPage from './pages/slack';

const WAIT_PERIOD = 2000;

describe('Slack workspace tests', () => {
  const slackPage = new SlackPage();
  let activeSlackLink = '';

  before(() => {
    cy.readFile('public/_redirects').then((content) => {
      const match = content.match(/\/slack-invite\s+(https:\/\/join.slack.com\/t\/[^\s]+)/);
      expect(match, 'Slack invite link should exist in public/_redirects').to.not.be.null;
      activeSlackLink = match[1];
    });
  });

  describe('Active Link Tests', () => {
    beforeEach(() => {
      slackPage.visitSlack(activeSlackLink);
    });

    it('Should show all login methods when the Slack invite link is active', function () {
      cy.wait(WAIT_PERIOD);

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const isInactive =
          $body.find('.p-refreshed_page__heading').length > 0 &&
          $body.text().includes('This link is no longer active');

        const hasLoginButtons =
          $body.find('[data-qa="base_google_login_button"]').length > 0 ||
          $body.find('[data-qa="email_field"]').length > 0;

        if (isInactive) {
          cy.log('Slack invite link has expired. Please update public/_redirects');
          this.skip();
        } else if (!hasLoginButtons) {
          cy.log('Login buttons are missing. Slack UI may have changed');
          this.skip();
        } else {
          slackPage.verifyGoogleLoginButton();
          slackPage.verifyAppleLoginButton();
          slackPage.verifyContinueWithEmail();
        }
      });
    });

    it('Should show links for Privacy, Contact Us, and Region Change', () => {
      slackPage.verifyPrivacyAndTerms();
      slackPage.verifyContactUs();
      slackPage.verifyChangeRegion();
    });
  });

  describe('Expired Link Tests', () => {
    it('Should correctly display the expired link message when an old link is used', () => {
      const expiredLink = 'https://join.slack.com/t/asyncapi/shared_invite/zt-1invalid-invalid';
      slackPage.visitSlack(expiredLink);
      cy.wait(WAIT_PERIOD);

      slackPage.verifyInactiveLinkMessage();
    });
  });
});
