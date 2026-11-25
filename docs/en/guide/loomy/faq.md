# Frequently Asked Questions (FAQ)

## Privacy and Security Related

### Will my files be uploaded to the cloud?

Loomy's file operations are completed locally by default, and it will not directly upload your entire working directory to the cloud. However, to support AI understanding, summarization, and analysis, relevant text content will be sent to large model API service providers for processing.

### Which of my files can AI access?

Loomy can only access the **working directories you explicitly authorize**. For files in unauthorized directories, if access is truly needed during task execution, Loomy will first seek your consent and will not read them directly by default.

### Can Loomy use my own model service provider API Key?

Yes. Loomy provides default model services for users out of the box; if you have your own model service provider, you can also configure your own API Key in Loomy to use.
When you use your own API Key, Loomy will not upload any additional confidential information. The relevant key will only be saved locally and used locally when you initiate the corresponding model call. It will not be hosted or synchronized to the cloud by the Loomy platform.

### Does the Loomy mobile app read my clipboard?

Only when you act. When you tap copy on a message, Loomy writes the selected content to the system clipboard; when you choose paste in the input box, it reads only the text you are pasting and fills it in. Loomy does not read the clipboard continuously or periodically in the background, and pasting alone does not upload clipboard content to its servers — the text is processed as your instruction only after you confirm sending it. See section 2.4 of the [Loomy Privacy Policy (Mobile)](https://loomy.xunfei.cn/docs/Safe/Loomy-mobile-privacy) for details.

## Target Audience

### What kind of users is it suitable for?

Loomy is suitable for people who need to frequently handle information organization, content creation, document collaboration, task follow-up, and cross-tool execution. For example:
*   Self-media operations
*   Office white-collar workers
*   Content teams
*   Small business teams
*   E-commerce practitioners
*   Individual users who hope to hand over repetitive processes to AI for assistance

If your work frequently requires switching back and forth between chats, emails, documents, web pages, and to-dos, Loomy can help you work more efficiently.

### Which integrations can call Loomy?

Use the official client, website or an explicitly authorized integration within its granted scope. Authorized Skills, connectors and automation are supported. The agreement restricts access to private endpoints, sharing login tokens with unauthorized tools, evading rate or quota limits, and proxying or reselling access without authorization. See section IV.4 of the [Loomy user agreement](https://loomy.xunfei.cn/docs/Safe/Loomy-user).
