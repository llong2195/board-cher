import * as Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * TemplateEngine - Wrapper for Handlebars template rendering
 * Supports template caching and custom helpers
 */
@Injectable()
export class TemplateEngine {
  private readonly logger = new Logger(TemplateEngine.name);
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate
  >();
  private readonly templateDirectory: string;
  private readonly cacheTemplates: boolean;

  constructor(private readonly configService: ConfigService) {
    this.templateDirectory = this.configService.get<string>(
      'email.templates.directory',
      'src/infrastructure/email/templates',
    );
    this.cacheTemplates = this.configService.get<boolean>(
      'email.templates.cacheTemplates',
      process.env.NODE_ENV === 'production',
    );

    this.registerHelpers();
    this.logger.log(
      `Template engine initialized (cache: ${this.cacheTemplates})`,
    );
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Time formatting helper
    Handlebars.registerHelper('formatTime', (date: Date | string) => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    // DateTime formatting helper
    Handlebars.registerHelper('formatDateTime', (date: Date | string) => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    // Pluralization helper
    Handlebars.registerHelper(
      'pluralize',
      (count: number, singular: string, plural?: string) => {
        if (count === 1) return singular;
        return plural || `${singular}s`;
      },
    );

    // Truncate text helper
    Handlebars.registerHelper(
      'truncate',
      (text: string, length: number = 100) => {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
      },
    );

    // Conditional equality helper
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    // Conditional not-equal helper
    Handlebars.registerHelper('neq', (a: any, b: any) => a !== b);

    // Conditional greater-than helper
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);

    // Conditional less-than helper
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);

    // URL encoding helper
    Handlebars.registerHelper('urlEncode', (text: string) => {
      return encodeURIComponent(text || '');
    });

    // JSON stringify helper (for debugging)
    Handlebars.registerHelper('json', (context: any) => {
      return JSON.stringify(context, null, 2);
    });
  }

  /**
   * Render template with context data
   */
  async render(templateName: string, context: any): Promise<string> {
    try {
      const template = await this.getTemplate(templateName);
      return template(context);
    } catch (error) {
      this.logger.error(
        `Failed to render template ${templateName}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  /**
   * Get compiled template (from cache or filesystem)
   */
  private async getTemplate(
    templateName: string,
  ): Promise<HandlebarsTemplateDelegate> {
    // Check cache first
    if (this.cacheTemplates && this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Load and compile template
    const templatePath = this.resolveTemplatePath(templateName);
    const templateSource = await this.loadTemplate(templatePath);
    const compiledTemplate = Handlebars.compile(templateSource);

    // Cache if enabled
    if (this.cacheTemplates) {
      this.templateCache.set(templateName, compiledTemplate);
    }

    return compiledTemplate;
  }

  /**
   * Resolve template path
   */
  private resolveTemplatePath(templateName: string): string {
    // If templateName already has extension, use as-is
    if (templateName.endsWith('.hbs') || templateName.endsWith('.handlebars')) {
      return path.join(process.cwd(), this.templateDirectory, templateName);
    }

    // Otherwise, add .hbs extension
    return path.join(
      process.cwd(),
      this.templateDirectory,
      `${templateName}.hbs`,
    );
  }

  /**
   * Load template from filesystem
   */
  private async loadTemplate(templatePath: string): Promise<string> {
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(
        `Failed to load template from ${templatePath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw new Error(`Template not found: ${templatePath}`);
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.templateCache.size;
  }

  /**
   * Precompile and cache all templates in directory
   */
  async precompileTemplates(): Promise<void> {
    if (!this.cacheTemplates) {
      this.logger.warn('Template caching is disabled, skipping precompilation');
      return;
    }

    try {
      const templateDir = path.join(process.cwd(), this.templateDirectory);
      const files = await fs.readdir(templateDir);
      const templateFiles = files.filter(
        (f) => f.endsWith('.hbs') || f.endsWith('.handlebars'),
      );

      this.logger.log(`Precompiling ${templateFiles.length} templates...`);

      for (const file of templateFiles) {
        const templateName = file.replace(/\.(hbs|handlebars)$/, '');
        await this.getTemplate(templateName);
      }

      this.logger.log(
        `Successfully precompiled ${this.templateCache.size} templates`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to precompile templates: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
