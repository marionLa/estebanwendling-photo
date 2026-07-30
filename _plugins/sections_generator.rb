module Jekyll
  class SectionsGenerator < Generator
    safe true
    priority :high

    ASSETS_IGNORED = %w[fluxus images slides . ..].to_set

    IMAGE_EXTS = %w[.jpg .jpeg .png .gif .webp].to_set

    def generate(site)
      source   = site.source
      sections = collect_sections(source)
      slides   = collect_slides(source)

      site.data['sections'] = sections
      site.data['slides']   = slides

      sections.each { |s| site.pages << SectionPage.new(site, source, s) }
    end

    private

    def collect_sections(source)
      assets_dir = File.join(source, 'assets')
      Dir.entries(assets_dir)
         .select { |e| valid_section?(assets_dir, e) }
         .sort
         .map    { |slug| build_section(assets_dir, slug) }
    end

    def valid_section?(assets_dir, entry)
      return false if ASSETS_IGNORED.include?(entry)
      return false if entry.start_with?('.')
      path = File.join(assets_dir, entry)
      File.directory?(path) && File.exist?(File.join(path, 'couverture.jpg'))
    end

    def build_section(assets_dir, slug)
      dir    = File.join(assets_dir, slug)
      photos = Dir.entries(dir)
                  .select { |f| image?(f) && f != 'couverture.jpg' }
                  .sort
                  .map do |f|
                    path = File.join(dir, f)
                    w, h = jpeg_dimensions(path)
                    { 'src' => "assets/#{slug}/#{f}", 'width' => w, 'height' => h }
                  end
      infos_file = File.join(dir, 'infos.txt')
      infos = File.exist?(infos_file) ? File.read(infos_file).split("\n").map(&:strip).reject(&:empty?) : []
      {
        'slug'   => slug,
        'title'  => slug_to_title(slug),
        'cover'  => "assets/#{slug}/couverture.jpg",
        'photos' => photos,
        'infos'  => infos
      }
    end

    def collect_slides(source)
      dir = File.join(source, 'assets', 'slides')
      return [] unless File.directory?(dir)
      Dir.entries(dir)
         .select { |f| image?(f) }
         .sort
         .map    { |f| "assets/slides/#{f}" }
    end

    def image?(filename)
      IMAGE_EXTS.include?(File.extname(filename).downcase)
    end

    def jpeg_dimensions(path)
      File.open(path, 'rb') do |f|
        magic = f.read(2)
        return [nil, nil] unless magic&.getbyte(0) == 0xFF && magic&.getbyte(1) == 0xD8
        loop do
          marker = f.read(2)
          break unless marker && marker.bytesize == 2 && marker.getbyte(0) == 0xFF
          code   = marker.getbyte(1)
          length = f.read(2)&.unpack1('n')
          break unless length
          if (0xC0..0xCF).include?(code) && code != 0xC4 && code != 0xC8 && code != 0xCC
            data   = f.read(length - 2)
            height = data[1, 2].unpack1('n')
            width  = data[3, 2].unpack1('n')
            return [width, height]
          else
            f.seek(length - 2, IO::SEEK_CUR)
          end
        end
      end
      [nil, nil]
    end

    def slug_to_title(slug)
      slug.split('-').map(&:capitalize).join(' ')
    end
  end

  class SectionPage < Page
    def initialize(site, base, section)
      @site = site
      @base = base
      @dir  = "portfolio/#{section['slug']}"
      @name = 'index.html'

      process(@name)
      self.data = {
        'layout'       => 'section',
        'title'        => section['title'],
        'permalink'    => "/portfolio/#{section['slug']}/",
        'section_slug' => section['slug']
      }
      self.content = ''
    end
  end
end
