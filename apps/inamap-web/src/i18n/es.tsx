const customEs = {

  
    "Delivery Method": "Método de Entrega",
    "Table Number": "Número de Mesa",
    "Counter": "Mostrador",
    "Table": "Mesa",
    "Delivery": "Entrega",
    tab: {
        attribute: {
            note: "Nota",
        },
        tabs: 'Tabs',
        kitchen_tabs: 'Comandas de Cocina',
        action: {
            cancel: 'Cancelar',
            confirm: 'Confirmar',
            print: 'Imprimir',
            pay: 'Pagar',
            close: 'Cerrar',
            confirmed: "Confirmar",
            in_preparation: "Iniciar Preparación",
            prepared: "Preparado",
            delivered: "Entregado",
            closed: "Cerrar",
            close_tab: "Cerrar Tab",
            print_tab: "Imprimir Tab",
            download: "Descargar Tab",
            payment: "Registrar Pago",
        },
        status: {
            created: 'Creado',
            confirmed: 'Confirmado',
            preparing: 'Preparando',
            ready: 'Listo',
            delivered: 'Entregado',
            completed: 'Completado',
            cancelled: 'Cancelado',
            in_preparation: "En Preparación",
            prepared: "Preparado",
            closed: "Cerrado",
            label: "Estado",
            change_to: "Cambiar estado a %{status}",
            error_updating: "Error actualizando estado",
        },
        products: {
            search: {
                label: "Buscar",
                clear: "Limpiar búsqueda",
                local_active: "Búsqueda local activa. Escribe %{count} caracteres más para búsqueda en servidor.",
                server_active: "Búsqueda en servidor activa",
                local_search: "Búsqueda local: %{term}",
                recent_searches: "Búsquedas recientes:",
            },
            cache: {
                cached_results: "Resultados en caché (hace {seconds}s)",
                loading_fresh: "Cargando datos frescos...",
                products_cached: "%{count} productos en caché",
            },
            infinite_scroll: {
                end_of_results: "Fin de los resultados",
            },
            no_products_category: "No hay productos en esta categoría",
            loading: "Cargando productos...",
            updating: "Actualizando...",
            display: {
                showing_results: "Mostrando %{displayed} de %{total} resultados",
                showing_results_local: "Mostrando %{displayed} de %{total} resultados (local)",
            },
            buttons: {
                show_more: "Mostrar Más (%{count} restantes)",
                show_less: "Mostrar Menos",
            },
            no_results: "No se encontraron productos para %{term}",
            no_results_hint: "Intenta escribir %{count} caracteres más para buscar en el servidor",
            modifier: {
                dialog: {
                    title: "%{productName} - Seleccionar Opciones",
                    cancel: "Cancelar",
                    add: "Agregar a la Orden",
                },
            },
            message: {
                added: "Producto agregado a la orden",
                created_success: "¡Tab creada exitosamente!",
            },
        },
        order: {
            no_products: "No hay productos en la orden",
            add_products_hint: "Comienza a agregar productos para crear tu orden",
            products_list: "Productos de la Orden",
            modifiers: "Modificadores",
            note_placeholder: "Agregar una nota para este ítem...",
            quantity: "Cantidad",
            total: "Total",
            summary: "Resumen de la Orden",
            subtotal: "Subtotal:",
            suggested_service: "Servicio sugerido (%{percent}%):",
            currency: "Moneda: %{code} (%{symbol})",
            discount: "Descuento",
            type: "Tipo",
            value: "Valor",
            discount_reason: "Razón del descuento (opcional)",
            discount_reason_placeholder: "Ej: Cortesía del chef, Cliente frecuente, Promoción...",
            no_discount: "Sin descuento",
            percentage: "Porcentaje",
            fixed_amount: "Monto Fijo",
            discount_applied: "Descuento aplicado:",
        },
        modal: {
            close_status: {
                title: "Estado de Cierre",
                message: "Por favor selecciona un estado de cierre para esta Tab",
            },
            close: "Cerrar Tab",
            cancel: "Cancelar Tab",
            payment: {
                title: "Registrar Pago",
                tip: "Propina",
                method: "Método",
                is_paid: "Pagado",
                closing_status: "Estado de Cierre",
                details: "Detalles de Pago",
            },
            close_confirm: {
                title: "Cerrar Tab",
                confirmation: "¿Estás seguro de que deseas cerrar esta Tab?",
                status: "Estado de Cierre",
            },
            assistance_dialog: {
                title: "Asistencia",
                message: "Tu solicitud de asistencia ha sido recibida.",
                staff_notified: "El personal ha sido notificado",
                store_label: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
                customer_label: "Cliente",
                table_label: "Mesa",
                estimated_time_label: "Tiempo estimado",
                remaining_requests_label: "Solicitudes restantes",
                cooldown_remaining: "Tiempo de espera restante",
                close_button: "Cerrar",
            },
        },
        list: {
            timer: {
                confirmed: "Confirmado",
                in_preparation: "En Preparación",
            },
            item: {
                note: "Nota",
                option: "Opción",
            },
            total: "Total",
        },
        payment_method: {
            cash: "Efectivo",
            card: "Tarjeta",
            transfer: "Transferencia",
        },
        queue: {
            download: "Tab #{id} en cola para descarga",
            print: "Tab #{id} en cola para impresión",
            payment_update: "Tab #{id} en cola para actualización de pago",
            status_update: "Tab #{id} en cola para actualización de estado a %{status}",
        },
        download: {
            success: "Tab #{id} descargada exitosamente",
            error: "Error descargando Tab #{id}: %{error}",
        },
        print: {
            success: "Tab #{id} enviada a la impresora",
            error: "Error imprimiendo Tab #{id}: %{error}",
        },
        payment_update: {
            success: "Pago de Tab #{id} actualizado exitosamente",
            error: "Error actualizando pago para Tab #{id}: %{error}",
        },
        status_update: {
            success: "Estado de Tab #{id} actualizado a %{status}",
            error: "Error actualizando estado para Tab #{id}: %{error}",
        },
        status_change_notification: "El estado de la orden cambió de %{old} a %{new}",
        paid: "Pagado",
        total: "Total",
        item: {
            note: "Nota",
            option: "Opción",
        },
        assistance: {
            request_help: "Solicitar Asistencia",
            requesting: "Solicitando Asistencia...",
            help_description: "¿Necesitas ayuda? Toca para solicitar asistencia al personal.",
            success_message: "Solicitud de asistencia enviada exitosamente.",
            error_message: "Error al enviar solicitud de asistencia.",
            not_available: "Asistencia no disponible en este momento.",
            cooldown_remaining: "Espera %{time}",
        },
        product: {
            add: "Agregar",
        },
        store: {
            featured_products: "Productos Destacados",
            no_products: "No hay productos destacados disponibles.",
        },
        debug: {
            title: "Info de Depuración",
            recording_state: "Estado de Grabación",
            processing_state: "Estado de Procesamiento",
            recording_attempts: "Intentos de Grabación",
            audio_chunks: "Fragmentos de Audio",
            session_id: "ID de Sesión",
            tab_id: "ID de Tab",
            has_tab_data: "Tiene Datos de Tab",
            last_transcription: "Última Transcripción",
            active: "Activo",
            inactive: "Inactivo",
            yes: "Sí",
            no: "No",
        },
        context: {
            title: "Contexto de Tab",
            table: "Mesa",
            status: "Estado",
            items: "Ítems",
            current_order: "Orden Actual",
            more_items: "... y %{count} ítems más",
        },
        resource: {
            tabs_admin: 'Administración de Tabs',
            filter: {
                status: 'Estado',
            },
            tabs: 'Tabs',
            kitchen: 'Cocina',
            menu: {
                list: 'Lista',
                kitchen_active: 'Órdenes Activas',
            },
            action: {
                create: 'Crear',
            },
        },
        view_order: {
            title: "Orden #%{id}",
            no_data: "No hay datos de la orden disponibles",
            products_title: "Productos",
            product_default: "Producto",
            option_default: "Opción",
            unit_price_suffix: "precio unitario",
            subtotal: "Subtotal",
            discount: "Descuento",
            total: "Total",
            paid: "Pagado",
            order_note: "Nota de la Orden",
            marketplace_info: "Marketplace: %{name}",
            type: "Tipo",
            payment_info: "Información de Pago",
            payment_status: "Estado de Pago",
            pending: "Pendiente",
            broker_status: "Estado del Broker",
            receipt: "Recibo",
            invoice: "Factura",
            view_document: "Ver Documento",
            dates_times: "Fechas y Horas",
            created_at: "Creado el",
            confirmed_at: "Confirmado el",
            preparing_at: "Iniciado el",
            prepared_at: "Preparado el",
            delivered_at: "Entregado el",
            closed_at: "Cerrado el",
            cancelled_at: "Cancelado el",
            tenant_info: "Información del Local",
            name: "Nombre",
            address: "Dirección",
            phone: "Teléfono",
            email: "Correo"
        },
    },
    kiosk: {
        // Header
        total: 'Total',
        clear_cart: 'Limpiar Carrito',
        view_order: 'Ver Orden',
        add_items_to_start: 'Agrega ítems para comenzar',

        // Navigation
        prev: 'Ant',
        next: 'Sig',
        page_of: 'Página %{current} de %{total} • %{items} ítems',
        products: 'Productos',

        // Product Card
        customizable: 'Personalizable',

        // Product Grid
        no_products_found: 'No se encontraron productos en esta categoría',

        // Cart View
        your_order: 'Tu Orden',
        cart_empty: 'Tu carrito está vacío',
        browse_menu: 'Explorar Menú',
        note: 'Nota',
        order_options: 'Opciones de Orden',
        delivery_method: 'Método de Entrega',
        table_number: 'Número de Mesa',
        your_name: 'Tu Nombre (Opcional)',
        special_instructions: 'Instrucciones Especiales (Opcional)',
        cancel_order: 'Cancelar Orden',
        confirm_order: 'Confirmar Orden',
        submitting: 'Enviando...',

        // Modifier Modal
        select_multiple: 'Selección múltiple',
        required: '*Requerido',
        cancel: 'Cancelar',
        add_to_order: 'Agregar a la Orden',

        // Confirmation View
        order_confirmed: '¡Orden Confirmada!',
        thank_you: 'Gracias por tu orden. Por favor espera a que llamen tu número.',
        your_order_number: 'Tu Número de Orden',
        status: 'Estado',
        start_new_order: 'Iniciar Nueva Orden',
        auto_reset_notice: 'Esta pantalla se reiniciará automáticamente en 30 segundos',
        loading: 'Cargando...',
    },
    // Resource labels for admin panel
    resource: {
        tabs_admin: "Admin Tabs",
        tabs: "Tabs",
        kitchen: "Cocina",
        menu: {
            list: "Lista",
        },
        action: {
            create: "⊕ Crear Tab",
        },
        filter: {
            status: "Estado",
        },
        layout: {
            products: "Productos",
            order: "Orden",
        },
        // Groups
        groups: {
            reports: 'Reportes',
            system_resources: 'Recursos del Sistema',
            products: 'Productos',
            integrations: 'Integraciones',
            configuration: 'Configuración',
            campaigns: 'Campañas',
            import_export: 'Importar/Exportar',
            cashier: 'Caja',
            ai_agent: 'Agente IA',
            devices: 'Dispositivos',
        },
        reports: {
            label: 'Reportes',
            menu_list: 'Reportes',
        },
        ai: {
            usage: {
                label: 'Uso de IA',
                menu_list: 'Reporte de Uso',
                field_tenancy: 'Cuenta de Tenencia',
                field_tenant: 'Cliente',
                field_agent: 'Agente',
                field_kind: 'Tipo',
                field_provider: 'Proveedor',
                field_model: 'Modelo',
                field_input_tokens: 'Tokens de Entrada',
                field_output_tokens: 'Tokens de Salida',
                field_total_tokens: 'Tokens Totales',
                field_duration_ms: 'Duración (ms)',
                field_iterations: 'Iteraciones',
                field_succeeded: 'Exitoso',
                field_error: 'Error',
                field_created_at: 'Fecha',
                field_date_from: 'Desde',
                field_date_to: 'Hasta',
                field_cache_read_tokens: 'Tokens de Caché (lectura)',
                field_cache_write_tokens: 'Tokens de Caché (escritura)',
                field_provider_latency_ms: 'Latencia del Proveedor (ms)',
                field_rag_results: 'Resultados de Búsqueda',
                field_rag_top_k: 'Top K de Búsqueda',
                field_rag_documents: 'Documentos Consultados',
                field_session_id: 'Sesión',
                field_run_id: 'Ejecución',
                field_source: 'Origen',
                succeeded_yes: 'Exitoso',
                succeeded_no: 'Fallido',
            },
        },
        // System resources
        system: {
            tenants: {
                label: 'Clientes',
                menu_list: 'Clientes',
                menu_trash: 'Papelera',
                main_action: 'Agregar Cliente',
                filter_name: 'Nombre',
            },
            roles: {
                label: 'Roles',
                menu_list: 'Roles',
                main_action: 'Agregar Rol',
                filter_name: 'Nombre',
            },
            users: {
                label: 'Usuarios',
                menu_list: 'Usuarios',
                menu_trash: 'Papelera',
                main_action: 'Crear Usuario',
                filter_search: 'Buscar',
            },
        },
        // E-commerce resources
        ecommerce: {
            products: {
                label: 'Productos',
                menu_list: 'Productos',
                menu_trash: 'Papelera',
                main_action: 'Crear Producto',
                filter_name: 'Nombre',
                filter_description: 'Descripción',
                filter_sku: 'SKU',
                filter_categories: 'Categorías',
                filter_status: 'Estado',
                filter_is_pack: 'Es Pack',
                tabs: {
                    product: 'Producto',
                    category_modifiers: 'Categoría/Modificadores',
                    prices: 'Precios',
                    stocks: 'Stocks',
                    brand: 'Marca',
                    metadata: 'Metadata',
                    gallery: 'Galería',
                    history: 'Historial',
                    tenants: 'Tenants',
                },
                fields: {
                    image: 'Imágen',
                    name: 'Nombre',
                    description: 'Descripción',
                    is_enabled: 'Disponible',
                    featured: 'Destacado',
                    mall_listed: 'Listado en Mall',
                    keywords: 'Palabras clave',
                    terms: 'Términos fonéticos (voz)',
                    sku: 'SKU',
                    display_order: 'Orden',
                    display_order_helper: 'Orden de visualización (1 = primero, 0 = último)',
                    categories: 'Categorías',
                    modifier_groups: 'Grupos de Modificadores',
                    prices: 'Precios',
                    stocks: 'Stocks',
                    infinite_stock: 'Stock permanente',
                    brand: 'Marca',
                    metadata: 'Metadata',
                    gallery: 'Galería',
                    history: 'Historial',
                    tenants: 'Tenants',
                },
                view: {
                    active: 'Activo',
                    inactive: 'Inactivo',
                    pack: 'Pack',
                    sku: 'SKU',
                    primary_price: 'Precio Principal',
                    stock_status: 'Estado de Stock',
                    categories_count: 'Categorías (%{count})',
                    edit: 'Editar',
                    edit_product: 'Editar Producto',
                    deactivate: 'Desactivar',
                    activate: 'Activar',
                    edit_gallery: 'Editar Galería',
                    primary_image: 'Imagen Principal',
                    images_count: 'Imágenes (%{count})',
                    no_images: 'Sin imágenes',
                    quick_summary: 'Resumen Rápido',
                    pricelists_stat: 'Listas de Precios',
                    stock_types_stat: 'Tipos de Stock',
                    platforms_stat: 'Plataformas',
                    categories_stat: 'Categorías',
                    stock: 'Stock',
                    infinite_stock_enabled: 'Este producto tiene stock infinito habilitado',
                    stock_level: 'Nivel de stock: %{percentage}%',
                    no_stock_types: 'Este producto no tiene tipos de stock configurados',
                    primary: 'Principal',
                    basic_info: 'Información Básica',
                    description: 'Descripción',
                    keywords: 'Palabras Clave',
                    brand: 'Marca',
                    no_categories: 'Este producto no tiene categorías asignadas',
                    category_order: 'Orden: %{order}',
                    prices: 'Precios',
                    no_prices: 'Este producto no tiene precios configurados',
                    active_platforms: 'Plataformas Activas',
                    no_platforms: 'Este producto no está activo en ninguna plataforma',
                    modifier_groups: 'Grupos de Modificadores',
                    modifier_type: 'Tipo: %{type}',
                    required: 'Requerido',
                    optional: 'Opcional',
                    min_label: 'Min: %{min}',
                    max_label: 'Max: %{max}',
                    options_count: 'Opciones (%{count})',
                    default_option: 'Por defecto',
                    characteristics: 'Características del Producto',
                    metadata_fallback: 'Metadata',
                    pack_contents: 'Contenido del Pack',
                    quantity: 'Cantidad',
                    pack_sku: 'SKU: %{sku}',
                    product_urls: 'URLs del Producto',
                    url_fallback: 'URL',
                    stock_infinite: 'Stock Infinito',
                    stock_out: 'Sin Stock',
                    stock_low: 'Stock Bajo',
                    stock_good: 'En Stock',
                },
            },
            categories: {
                label: 'Categorías',
                menu_list: 'Lista de Categorías',
                main_action: 'Crear Categoría',
                filter_name: 'Nombre',
            },
            brands: {
                label: 'Marcas',
                menu_list: 'Lista de Marcas',
                main_action: 'Crear Marca',
            },
            galleries: {
                label: 'Galerías',
                menu_list: 'Lista de Galerías',
                main_action: 'Crear Galería',
                filter_name: 'Nombre',
            },
            currencies: {
                label: 'Monedas',
                menu_list: 'Lista de Monedas',
                main_action: 'Crear Moneda',
            },
            pricelists: {
                label: 'Listas de Precios',
                menu_list: 'Listas de Precios',
                main_action: 'Crear Lista de Precios',
            },
            modifiers: {
                label: 'Grupos de Modificadores',
                menu_list: 'Lista de Modificadores',
                main_action: 'Crear Grupo de Modificadores',
                filter_name: 'Nombre',
                filter_selection_mode: 'Modo de Selección',
                filter_is_active: 'Activo',
            },
            stock_types: {
                label: 'Tipo de Stock',
                menu_list: 'Tipos de Stock',
                main_action: 'Crear Tipo de Stock',
            },
            marketplaces: {
                label: 'Marketplaces',
                menu_list: 'Ver Marketplaces',
                main_action: 'Agregar Marketplace',
            },
            point_of_sale: {
                label: 'Puntos de Venta',
                menu_list: 'Ver Puntos de Venta',
                main_action: 'Agregar Punto de Venta',
            },
            tenant_data: {
                label: 'Datos',
                menu_list: 'Módulo Cliente Ecommerce',
            },
            users: {
                label: 'Usuarios',
            },
        },
        // Campaigns
        campaigns: {
            label: 'Campañas',
            menu_list: 'Lista de Campañas',
            main_action: 'Crear',
            filter_name: 'Nombre',
        },
        // Import/Export
        import: {
            templates: {
                label: 'Plantillas de Importación',
                menu_list: 'Plantillas',
                main_action: 'Crear Plantilla',
            },
            instances: {
                label: 'Importar Productos',
                menu_list: 'Importaciones',
                main_action: 'Importar Productos',
                tabs: {
                    datos: 'Datos',
                    extraction: 'Extracción IA',
                    preview: 'Previsualizar',
                    import: 'Importar',
                    logs: 'Logs',
                },
                fields: {
                    import_type: 'Tipo de Importación',
                    template: 'Plantilla',
                    file: 'Archivo',
                    menu_source: 'Origen del Menú',
                    extraction: 'Extracción IA',
                    options: 'Opciones de Importación',
                    status: 'Estado',
                    preview: 'Previsualizar',
                    import_action: 'Importar',
                    logs: 'Logs',
                    created_at: 'Creado',
                    updated_at: 'Actualizado',
                },
                types: {
                    normalized: {
                        title: 'Importación Normalizada (Recomendado)',
                        desc: 'Utiliza el formato normalizado estándar con columnas predefinidas',
                    },
                    template: {
                        title: 'Importación con Plantilla',
                        desc: 'Utiliza una plantilla personalizada para mapear columnas',
                    },
                    ai_menu: {
                        title: 'Importación con IA',
                        desc: 'Sube un menú en PDF o imágenes; la IA extrae los productos para que los revises',
                    },
                },
                options: {
                    advanced_config: 'Configuración Avanzada',
                    no_options: 'No hay opciones configurables para este tipo de importación.',
                    view_title: 'Opciones de Importación (%{type})',
                },
                alerts: {
                    select_template: 'Debe seleccionar una plantilla antes de subir el archivo',
                    normalized_format_title: 'Formato Normalizado:',
                    normalized_format_desc: 'Su archivo debe seguir el formato estándar con columnas como: sku, name, description, price_*, stock_*, category_name, brand_name, images, etc.',
                },
                messages: {
                    delete_file_confirm: '¿Está seguro de eliminar este registro?',
                    file_removed: '¡Archivo eliminado!',
                    delete_file_title: 'Eliminar archivo',
                    delete_file_content: '%{title} será eliminado',
                    only_excel: '¡Solo puedes subir archivos Excel!',
                    max_size: '¡El archivo debe ser menor a 2MB!',
                    no_file: '¡No hay archivo subido!',
                    unknown_format: 'Formato de archivo desconocido. ¡Solo se suben archivos Excel!',
                    no_data: '¡No se encontraron datos en el archivo!',
                    read_error: 'Error al leer el archivo Excel',
                },
                progress: {
                    title_preview: 'Progreso de Previsualización',
                    title_import: 'Progreso de Importación',
                    processed_count: '%{processed} de %{total} productos procesados',
                    currently_processing: 'Procesando actualmente:',
                    last_updated: 'Última actualización: %{time}',
                },
                stats: {
                    to_create: 'Por Crear',
                    to_update: 'Por Actualizar',
                    categories_to_create: 'Categorías por Crear',
                    brands_to_create: 'Marcas por Crear',
                    created: 'Creados',
                    updated: 'Actualizados',
                    categories_created: 'Categorías Creadas',
                    galleries_created: 'Galerías Creadas',
                    errors: 'Errores',
                    skipped: 'Omitidos',
                },
                dialog: {
                    already_completed: {
                        title: '%{mode} Ya Completado',
                        message: 'Este %{mode} ya se completó anteriormente.',
                        status: 'Estado actual: %{status}',
                        footer: 'Si necesita ejecutarlo nuevamente, actualice la página o cree una nueva instancia de importación.',
                    },
                    already_running: {
                        title: '%{mode} Ya en Ejecución',
                        message: '%{message}',
                        status: 'Estado actual: %{status}',
                        footer: 'Espere a que se complete el proceso actual o actualice la página para ver el estado más reciente.',
                    },
                },
                headers: {
                    preview_title: 'Previsualización de Importación Masiva',
                    preview_normalized_sub: 'Previsualización con formato normalizado',
                    preview_template_sub: 'Previsualización con plantilla personalizada',
                    import_title: 'Importación Masiva',
                    import_normalized_sub: 'Importación con formato normalizado',
                    import_template_sub: 'Importación con plantilla personalizada',
                },
                actions: {
                    preview_in_progress: 'Previsualización en progreso...',
                    preview_start: 'Previsualizar Importación',
                    import_in_progress: 'Importación en progreso...',
                    import_start: 'Iniciar Importación',
                },
                results: {
                    title: 'Resultados de %{mode}',
                },
                logs: {
                    placeholder: 'Previsualiza el log aquí...',
                    preview: 'Previsualizar',
                    download: 'Descargar',
                },
                select_template: 'Seleccionar Plantilla',
                no_template: {
                    normalized: 'La importación normalizada no requiere plantilla. Se utilizará el formato estándar.',
                    ai_menu: 'La importación con IA no requiere plantilla. Los productos se extraen del menú que subas.',
                },
                ai: {
                    upload_title: 'Sube el Menú',
                    upload_help: 'Sube el menú en PDF, o una imagen por página. Un modelo de IA lee cada página y extrae platos, precios y grupos de opciones para que los revises.',
                    kind_pdf: 'PDF',
                    kind_images: 'Imágenes',
                    drop_pdf: 'Arrastra un PDF o haz clic para subir',
                    drop_images: 'Arrastra las imágenes o haz clic para subir',
                    pdf_hint: 'Solo PDF — máximo %{limit} MB',
                    images_hint: 'JPG, PNG, WEBP — máximo %{limit} MB cada una',
                    pages_queued: 'Páginas a procesar',
                    page_order_hint: 'Las páginas se procesan en el orden en que se suben.',
                    page: 'página',
                    pages: 'páginas',
                    file_too_large: 'El archivo "%{name}" supera el límite de %{limit} MB',
                    extract: 'Extraer con IA',
                    re_extract: 'Volver a extraer',
                    extracting: 'Extrayendo…',
                    extraction_queued: 'Extracción encolada. El progreso aparecerá aquí.',
                    extraction_started: 'Extracción con IA iniciada',
                    extraction_completed: 'Extracción completada — revisa el resultado',
                    extraction_failed: 'La extracción con IA falló',
                    save: 'Guardar Cambios',
                    saved: 'Cambios guardados. Confirma para habilitar la importación.',
                    download: 'Descargar .xlsx',
                    confirm: 'Confirmar y Generar',
                    confirmed: 'Extracción confirmada — %{rows} filas generadas. Ya puedes previsualizar e importar.',
                    confirmed_title: 'Extracción confirmada',
                    confirmed_help: 'El archivo de importación fue generado. Ve a la pestaña Vista Previa para continuar.',
                    review_required_title: 'Revisión requerida',
                    review_required_help: 'La extracción con IA no siempre es exacta. Revisa cada producto y precio, luego confirma — la vista previa y la importación permanecen deshabilitadas hasta entonces.',
                    confirm_before_import: 'Confirma la extracción con IA antes de ejecutar la vista previa o la importación.',
                    warnings_title: '%{count} punto(s) a revisar',
                    view_warnings: 'Ver advertencias',
                    close: 'Cerrar',
                    empty: 'Aún no hay nada extraído. Ejecuta la extracción para comenzar.',
                    not_applicable: 'Esta pestaña solo aplica a importaciones con IA.',
                    unsaved: 'Tienes cambios sin guardar.',
                    unnamed: '(sin nombre)',
                    product_name: 'Nombre',
                    category: 'Categoría',
                    category_hint: 'Separa con comas si son varias',
                    base_price: 'Precio Base',
                    sku: 'SKU',
                    sku_hint: 'Coincide con productos existentes',
                    description: 'Descripción',
                    modifier_groups: 'Grupos de Modificadores',
                    add_group: 'Agregar Grupo',
                    delete_group: 'Eliminar grupo',
                    delete_option: 'Eliminar opción',
                    price_column: 'Precio / Ajuste',
                    delete_product: 'Eliminar Producto',
                    group_name: 'Nombre del Grupo',
                    group_type: 'Tipo',
                    min_selections: 'Mín',
                    max_selections: 'Máx',
                    max_blank: 'Vacío = sin límite',
                    required: 'Obligatorio',
                    option_name: 'Opción',
                    price_adjustment: 'Precio +/-',
                    is_default: 'Por defecto',
                    add_option: 'Agregar Opción',
                    options: 'opciones',
                    model: 'Modelo',
                    tokens: 'Tokens',
                    cost: 'Costo est.',
                    cost_unknown: 'sin tarifa configurada',
                    rows: 'Filas',
                },
                statuses: {
                    NOT_INITIATED: 'No Iniciado',
                    EXTRACTION_INITIATED: 'Extrayendo…',
                    EXTRACTION_COMPLETED: 'Extracción Completada',
                    EXTRACTION_FAILED: 'Extracción Fallida',
                    PREVIEW_INITIATED: 'Vista Previa Iniciada',
                    PREVIEW_COMPLETED: 'Vista Previa Completada',
                    PREVIEW_FAILED: 'Vista Previa Fallida',
                    IMPORT_INITIATED: 'Importación Iniciada',
                    IMPORT_COMPLETED: 'Importación Completada',
                    IMPORT_FAILED: 'Importación Fallida',
                }
            },
        },
        // Mall resources
        mall: {
            label: 'Mall',
            menu_list: 'Lista',
            main_action: 'Crear Mall',
        },
        // Cash Count resources
        cashcount: {
            label: 'Arqueos de Caja',
            menu_list: 'Arqueos de Caja',
            main_action: 'Nuevo Arqueo',
            filter_status: 'Estado',
            filter_period_start: 'Inicio Período (Desde)',
            filter_period_end: 'Fin Período (Hasta)',
        },
        qr_generator: {
            title_self_service: "Generador QR Auto-Servicio",
            title_mall: "Generador QR Servicio Mall",
            welcome_title: "Módulo de auto-atención",
            welcome_subtitle: "Haga su pedido desde su teléfono!",
            print: {
                title: "📱 Ordena desde tu celular",
                subtitle: "Escanea el código QR para ver el menú",
                instructions: "Apunta tu cámara al código QR",
            }
        },
        // Tenancy resources
        tenancy: {
            groups: {
                account: "Cuenta",
                billing: "Facturación",
                system: "Sistema"
            },
            account: {
                label: "Cuenta",
            },
            subscription: {
                label: "Suscripción",
            },
            invoices: {
                label: "Facturas",
            },
            payment_methods: {
                label: "Métodos de Pago",
            },
            tenants: {
                label: "Locales",
                menu_all: "Ver Todos",
                main_action: "Agregar Local",
            },
        },
    },
    // Verification
    verify: {
        title: "Verificación de Cuenta",
        verifying: "Verificando tu cuenta...",
        invalidLink: "Enlace de verificación inválido o expirado. Redirigiendo...",
        success: "¡Cuenta verificada exitosamente! Redirigiendo...",
        alreadyVerified: "La cuenta ya está verificada. Redirigiendo...",
        error: "Ocurrió un error durante la verificación. Redirigiendo...",
    },
    // Profile
    profile: {
        title: "Perfil",
        subtitle: "Configuración de perfil",
        validation: {
            required: "El campo es requerido",
            passwords_dont_match: "Las contraseñas no coinciden",
        },
        success: "Usuario actualizado correctamente",
        error_prefix: "Error al actualizar el usuario,",
        error_default: "Error al actualizar el usuario",
        sections: {
            info_title: "Info",
            passwords_title: "Contraseñas",
        },
        fields: {
            name: "Nombre",
            lastname: "Apellido",
            email: "Email",
            current_password: "Contraseña actual",
            new_password: "Nueva contraseña",
            repeat_password: "Repita nueva contraseña",
        },
        actions: {
            save: "Guardar",
            saving: "Guardando...",
            save_passwords: "Guardar Contraseñas",
            saving_passwords: "Guardando Contraseñas...",
        }
    },
    // Dashboard
    dashboard: {
        title: "Panel de Control",
        welcome: "Bienvenido al Panel de Administración",
    },
    // Subscription module
    subscription: {
        fetch_error: "Error al obtener los planes de suscripción: %{message}",
        unsupported_plans: "%{count} plan(es) no disponible(s) con su método de pago actual. Para acceder a todos los planes, considere cambiar su método de pago.",
        no_compatible_plans: "No hay planes disponibles compatibles con su método de pago actual (%{gateway}). Por favor, contacte al administrador del sistema.",
        management: {
            title: "Gestión de Suscripción",
            subtitle: "Administra tu plan de suscripción y configuración de facturación.",
        },
        current: {
            title: "Suscripción",
            subtitle: "Administra tu suscripción y complementos.",
        },
        available_plans: {
            title: "Planes Disponibles",
            subtitle: "Elige un plan que se adapte a tus necesidades. Puedes mejorar o cambiar en cualquier momento.",
        },
        renews: "Renueva",
        no_active: "No tienes una suscripción activa. Elige un plan a continuación para comenzar.",
        current_plan: "Plan Actual",
        select_plan: "Seleccionar Plan",
        trial_days: "%{days} días de prueba",
        // Feature translations
        features: {
            basic_features: "Funciones básicas",
            email_support: "Soporte por email",
            one_store: "1 local incluido",
            three_users: "3 usuarios",
            fifty_products: "50 productos",
            unlimited_products: "Productos ilimitados",
            unlimited_users: "Usuarios ilimitados",
            priority_support: "Soporte prioritario",
            advanced_analytics: "Analíticas avanzadas",
            api_access: "Acceso a API",
        },
        // Plan change notifications
        pending_change_title: "Cambio de Plan Pendiente",
        pending_change_message: "Tu cambio de plan a %{plan} está pendiente de confirmación de pago. Recibirás un correo electrónico una vez que el pago sea procesado.",
        confirm_upgrade_title: "Confirmar Mejora de Plan",
        confirm_upgrade: "¿Estás seguro de que deseas mejorar a %{plan}?",
        confirm_downgrade_title: "Confirmar Cambio de Plan",
        confirm_downgrade: "¿Estás seguro de que deseas cambiar a %{plan}?",
        confirm_change_title: "Confirmar Cambio de Plan",
        confirm_change: "¿Estás seguro de que deseas cambiar a %{plan}?",
        upgrade_success: "Plan mejorado exitosamente a %{plan}",
        downgrade_success: "Plan cambiado exitosamente a %{plan}",
        change_success: "Plan cambiado exitosamente a %{plan}",
        upgrade_error: "Error al mejorar el plan",
        downgrade_error: "Error al cambiar el plan",
        change_error: "Error al cambiar el plan",
        downgrade_not_allowed: "No se permite cambiar a %{plan}",
        // Unsubscribe
        unsubscribe: {
            button: "Cancelar Suscripción",
            processing: "Cancelando...",
            confirm_title: "Cancelar Suscripción",
            confirm_message: "¿Estás seguro de que deseas cancelar tu suscripción?",
            confirm_button: "Cancelar Suscripción",
            access_until: "Acceso hasta:",
            days_remaining: "Días restantes:",
            what_happens_title: "Qué sucede cuando cancelas:",
            success: "Suscripción cancelada. Acceso hasta %{date}.",
            error: "Error al cancelar la suscripción",
            preview_error: "Error al cargar detalles de cancelación",
        },
        // Subscription management actions
        manage: "Administrar",
        choose_plan: "Elegir un plan",
        cancel_plan: "Cancelar plan",
        cancel_success: "Suscripción cancelada exitosamente",
        cancel_error: "Error al cancelar la suscripción",
        // Subscription details labels
        active: "Suscripción Activa",
        status_label: "Estado:",
        billing_cycle_label: "Ciclo de Facturación:",
        current_period_label: "Período Actual:",
        trial_ends_label: "Prueba Termina:",
        next_billing_label: "Próxima Facturación:",
        pending_change: "Cambio Pendiente",
        switching_to: "Cambiando a:",
        effective_date: "Efectivo:",
    },
    // Billing & Payment Gateways
    billing: {
        // Gateway Selector
        selectPaymentMethod: "Selecciona un Proveedor de Pago",
        selectPaymentMethodDesc: "Elige cómo quieres pagar tu suscripción",
        noGatewaysAvailable: "No hay métodos de pago disponibles para tu cuenta",
        supportedCurrencies: "Monedas",
        connecting: "Conectando...",
        addCard: "Agregar Tarjeta",
        
        // Add Payment Method Prompt
        addPaymentRequired: "Método de Pago Requerido",
        trialEndsIn: "Tu período de prueba termina en %{days} día(s)",
        trialEnded: "Tu período de prueba ha terminado",
        planContinue: "Agrega un método de pago para continuar usando %{plan}",
        
        // Gateway Callback
        callback: {
            processing: "Procesando tu tarjeta...",
            pleaseWait: "Por favor espera mientras completamos tu registro.",
            success: "¡Método de pago agregado exitosamente!",
            successTitle: "¡Éxito!",
            redirecting: "Redirigiendo...",
            noToken: "No se recibió token de registro",
            error: "Error al completar el registro",
            errorTitle: "Algo salió mal",
            tryAgain: "Intentar de Nuevo",
        },
        
        // Payment Methods
        paymentMethods: {
            title: "Métodos de Pago",
            description: "Administra tus métodos de pago para la suscripción.",
            noPaymentMethod: "Sin Método de Pago",
            addPaymentMethodToSubscribe: "Agrega un método de pago para suscribirte a un plan de pago.",
            addNew: "Agregar Método de Pago",
            setDefault: "Establecer como Predeterminado",
            remove: "Eliminar",
            default: "Predeterminado",
            expiresOn: "Vence el %{date}",
            noMethods: "Aún no has agregado métodos de pago",
            connected: "Conectado",
            paymentCard: "Tarjeta de Pago",
            removePaymentMethod: "Eliminar Método de Pago",
            removePaymentMethodTooltip: "Eliminar método de pago",
            confirmRemovePaymentMethod: "¿Estás seguro de que deseas eliminar este método de pago? Necesitarás agregar uno nuevo para continuar usando funciones de pago.",
            paymentMethodRemoved: "Método de pago eliminado",
            errorRemovingPaymentMethod: "Error al eliminar método de pago",
            addedOn: "Agregado el",
        },
        
        // Invoices
        invoices: {
            title: "Documento de Pago",
            document: "Documento",
            preview: "Vista previa del documento",
            view: "Ver",
            download: "Descargar",
            downloadAll: "Descargar Todo",
            close: "Cerrar",
            loading: "Cargando documento...",
            loadError: "Error al cargar el documento",
            downloadSuccess: "Documento descargado correctamente",
            downloadError: "Error al descargar el documento",
            notAvailable: "Documento no disponible",
            browserNotSupported: "Tu navegador no puede mostrar PDFs. Por favor descarga el documento.",
            // Document types
            documentType: {
                receipt: "Recibo",
                invoice: "Factura",
                document: "Documento",
            },
            // Status labels
            status: {
                succeeded: "Pagado",
                paid: "Pagado",
                pending: "Pendiente",
                failed: "Fallido",
                refunded: "Reembolsado",
            },
        },
    },
    mall: {
        // Orders
        no_active_orders: "No tienes órdenes activas. Puedes crear una nueva orden usando el menú.",

        // Store Selector
        all_stores: 'Todas las Tiendas',
        select_store: 'Selecciona una tienda',
        all: 'Todo',

        // Assistance
        request_assistance: 'Solicitar Asistencia',
        assistance_sent: 'Solicitud de asistencia enviada',
        assistance_error: 'Error al enviar solicitud de asistencia',

        // Search
        search_products: 'Buscar productos...',

        // Product Grid
        no_products_found: 'No se encontraron productos',
        try_different_store_or_search: 'Intenta seleccionar otra tienda o ajustar tu búsqueda',
        featured: 'Destacados',
        add: 'Agregar',

        // Pagination
        display_mode: 'Visualización',
        horizontal_pagination: 'Ver productos en páginas',
        infinite_scroll: 'Ver todos los productos en scroll',
        pages: 'Páginas',
        scroll: 'Scroll',
        prev: 'Ant',
        next: 'Sig',
        swipe_for_more: 'Desliza para más',
        products: 'productos',
        scroll_for_more: 'Desliza para más',

        // Cart Summary
        cart_empty: 'Tu carrito está vacío',
        view_cart: 'Ver Carrito',
        item: 'ítem',
        items: 'ítems',
        stores: 'tiendas',

        // Cart Drawer
        your_order: 'Tu Orden',
        add_products_to_continue: 'Agrega algunos productos para continuar',
        unknown_store: 'Tienda Desconocida',
        clear_cart: 'Limpiar Carrito',
        total: 'Total',
        confirm_order: 'Confirmar Orden',
        submit_order: 'Enviar Pedido',
        submitting_order: 'Enviando...',
        continue_shopping: 'Continuar Comprando',
        product_added: 'Producto agregado al carrito',
        product_added_with_name: '%{name} agregado al carrito',
        special_instructions: 'Instrucciones Especiales',
        special_instructions_placeholder: 'Agrega notas (ej: sin mayonesa, extra servilletas)...',
        modifiers: 'Modificadores',
        add_to_cart: 'Agregar al Carrito',
        required: 'Requerido',

        // Product Grid
        all_products: 'Todos los Productos',
        has_modifiers: 'Personalizable',
        no_more_products: 'No hay más productos',
        errors: {
            sessionIdRequired: "Se requiere ID de sesión de Mall",
            validationDefault: "Ocurrió un error validando la sesión",
            sessionExpired: "La sesión ha expirado. Las sesiones son válidas por 10 horas desde su activación.",
            sessionNotFound: "Sesión no encontrada. Por favor verifica el ID de sesión.",
            accessDenied: "Acceso denegado a esta sesión.",
            serverError: "Ocurrió un error en el servidor. Por favor intenta más tarde.",
            unableToValidate: "No se pudo validar la sesión. Por favor intenta de nuevo.",
        },
        session: {
            no_hash: "No se encontró hash de sesión de mall. No se puede rastrear el progreso de la orden.",
            order_status: {
                created: "Creado",
                created_text: "Tu orden ha sido creada. Por favor espera a que el personal la confirme.",
                confirmed: "Confirmado",
                confirmed_text: "Tu orden ha sido confirmada.",
                in_progress: "En Progreso",
                in_progress_text: "Tu orden está siendo procesada. Por favor espera.",
                in_preparation: "Preparando",
                in_preparation_text: "Tu orden está siendo preparada.",
                prepared: "Listo",
                prepared_text: "Tu orden está lista para retiro.",
                delivered: "Listo para Retiro",
                delivered_text: "Tu orden está lista para retiro. Por favor recógela en el área designada.",
                shipped: "Completado",
                shipped_text: "Tu orden ha sido enviada. ¡Gracias por tu compra!",
                picked_up: "Retirado",
                picked_up_text: "Tu orden ha sido retirada. ¡Gracias por tu compra!",
                closed: "Completado",
                closed_text: "Tu orden ha sido completada. ¡Gracias por tu compra!",
                returned: "Completado",
                returned_text: "Tu orden ha sido devuelta. ¡Gracias por tu compra!",
                cancelled: "Cancelado",
                cancelled_text: "Tu orden ha sido cancelada. Si tienes preguntas, por favor contacta soporte.",
                not_shipped: "Cancelado",
                not_shipped_text: "Tu orden no ha sido enviada. Si tienes preguntas, por favor contacta soporte.",
            },
            no_notifications: "Sin notificaciones",
            notifications: "Notificaciones",
            products_count: "Productos (%{count})",
            product: {
                unknown: "Producto Desconocido",
                quantity: "Cant: %{quantity}",
                pending: "Pendiente",
            },
            order_status_overall: "Estado General de la Orden",
            stores_progress: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            items: "ítems",
        },
    },

    selfservice: {
        welcome: {
            title: "¡Bienvenido!",
            subtitle: "",
            name_label: "Tu nombre",
            name_placeholder: "Ingresa tu nombre",
            delivery_method_label: "¿Cómo deseas recibir tu pedido?",
            table_service: "En mi mesa",
            counter_pickup: "En mostrador",
            table_label: "Número de mesa",
            counter_info: "Tu pedido estará listo para recoger en el mostrador. Te notificaremos cuando esté listo.",
            continue_button: "Continuar con mi orden",
            start_button: "Haz tu pedido!",
            session_info: "Sesión segura • Tus datos están protegidos",
        },
        menu: {
            your_orders: "Tus Ordenes",
            new_order: "Nueva Orden",
            order_here: "¡Haz tu pedido aquí!",
            place_order: "Hacer un pedido",
            checkout: "Ordenar",
        },
        timeline: {
            title: "Estado del Pedido",
        },
        voucher: {
            title: "Comprobante",
            dialog_title: "Comprobante",
            load_error: "Error cargando el comprobante",
            loading: "Generando comprobante...",
        },
        notifications: {
            title: "Notificaciones",
            new_update: "Nueva actualización en su pedido",
            mark_all_read: "Marcar todo como leído",
            empty: "No tiene notificaciones recientes.",
            empty_hint: "Las actualizaciones del pedido aparecerán aquí.",
        },
        settings: {
            title: "Configuración",
            save_button: "Guardar Cambios",
        }
    },


    common: {
        cancel: "Cancelar",
        keep: "Mantener Suscripción",
        view: "Ver",
        edit: "Editar",
        login: "Ingresar",
        signup: "Registrarse",
        unknown_error: "Error desconocido",
    },
    cashcount: {
        sales_count: "%{count} ventas",
        sales_count_short: "Ventas",
        amount: "Monto",
        tips: "Propinas",
        system_totals: "Totales del Sistema",
        final_totals: "Totales Finales",
        corrected: "Corregido",
        modified: "Modificado",
        system: "Sistema",
        location: "Ubicación",
        status: "Estado",
        unknown_location: "Ubicación Desconocida",
        system_values: "Sistema: %{sales} ventas, %{amount}, %{tips} propinas",
        was_value: "era %{value}",
        pos_breakdown: "Desglose por Punto de Venta",
        system_calculated_totals: "Totales Calculados por Sistema",
        status_closed: "✅ Este arqueo está finalizado y no puede ser modificado.",
        status_draft: "⚠️ Listo para cerrar: Guardar finalizará este arqueo permanentemente.",
        status_preview: "💡 Revisa y ajusta totales individuales por ubicación abajo. Los totales finales se calcularán automáticamente.",
        pos_breakdown_description: "Ajusta totales individuales por ubicación. Los totales principales se recalcularán automáticamente.",
        final_values: "Valores Finales",
        totals: "TOTALES",
        notes: "Notas",
        notes_placeholder: "Agrega notas sobre correcciones u observaciones...",
        notes_corrections_help: "Por favor explica la razón de las correcciones arriba.",
        notes_help: "Notas opcionales sobre este arqueo.",
        invalid_date: "Fecha inválida",
        duration_label: "Duración: %{duration}",
        cash_count_period: "Período de Arqueo",
        cash_count_period_readonly: "Período de Arqueo (Solo Lectura)",
        period_start: "Inicio Período",
        period_end: "Fin Período",
        duration: "Duración",
        period_auto_calculated: "Las fechas del período se calcularán automáticamente",
        automatic_calculation: "Cálculo Automático de Período:",
        automatic_calculation_description: "El arqueo comenzará donde terminó el último y continuará hasta ahora, asegurando que no haya brechas en tus registros.",
        current_period_sales: "Ventas del Período Actual",
        refresh: "Actualizar",
        first_period_message: "Este es tu primer período de arqueo. Mostrando ventas desde %{start} (hace %{days} días) hasta ahora.",
        period_since_last: "Mostrando ventas desde el último arqueo cerrado el %{lastEnd} (hace %{days} días).",
        total_sales: "Ventas Totales",
        total_amount: "Monto Total",
        total_tips: "Propinas Totales",
        daily_average: "Prom: %{avg}/día",
        growth_comparison: "Comparación de Crecimiento",
        daily_average_comparison: "Promedios diarios comparados con el último período cerrado",
        sales: "Ventas",
        percentage: "% del Total",
        top_products: "Productos Top",
        product: "Producto",
        quantity_sold: "Cant. Vendida",
        avg_price: "Precio Prom.",
        recent_orders: "Ordenes Recientes",
        order_id: "ID Orden",
        date_time: "Fecha y Hora",
        items: "Ítems",
        current_period_error: "Error cargando datos del período actual",
    },
    mission: {
        title: "Misión",
        description: "Descripción de la Misión",
        start: "Inicio",
        end: "Fin",
        status: "Estado",
        completed: "Completada",
        failed: "Fallida",
        in_progress: "En Progreso",
        not_started: "No Iniciada",
    },
    voice: {
        recording: "Grabando...",
        processing: "Procesando...",
        processing_ai: "Procesando con IA...",
        processing_voice: "Procesando voz...",
        processing_image: "Procesando imagen...",
        capturing: "Capturando...",
        capturing_countdown: "Capturando en %{countdown}...",
        applying: "Aplicando...",
        stop: "Detener",
        record: "Grabar",
        stop_recording: "Detener grabación",
        start_recording: "Iniciar grabación",
        stop_recording_full: "Detener Grabación",
        start_recording_full: "Iniciar Grabación",
        recording_disabled: "Grabación deshabilitada",
        recording_disabled_full: "Grabación de voz deshabilitada",
        ready_to_record: "Listo para grabar",
        actions_detected: "%{count} acción(es) detectada(s)",
        error_processing: "Error procesando comando de voz",
        error_connection: "Error de conexión. Revisa tu internet.",
        error_file_too_large: "El archivo de audio es demasiado grande",
        error_invalid_format: "Formato de audio inválido",
        applying_commands: "Aplicando comandos de voz...",
        error_enhanced: "Error procesando comandos de voz mejorados",
        ai_label: "IA",
        auto_label: "Auto",
        auto_apply_info: "Las acciones se aplicarán automáticamente",
        view_ai_analysis: "Ver análisis de IA",
        analysis: {
            title: "Análisis de Voz IA",
            transcription: "Transcripción",
            processing_steps: "Pasos de Procesamiento",
            actions_detected: "Acciones Detectadas (%{count})",
            no_data: "No hay análisis disponible",
            record_command: "Graba un comando de voz para ver análisis",
            view: "Ver análisis de IA",
            steps: {
                extraction: "1. Extracción",
                products: "2. Productos",
                enhanced: "3. IA Mejorada",
            },
            enhanced_results: "Resultados Mejorados",
            actions_count: "%{count} acciones",
            products_count: "%{count} productos",
            modifiers_ai: "%{count} modificadores IA",
            auto_added: "%{count} auto-agregados",
            products_found: "✓ %{count} producto(s) encontrado(s)",
            modifiers_ai_label: "🤖 Modificadores IA: %{modifiers}",
            modifiers_detected: "📝 Modificadores detectados: %{modifiers}",
            note: "📝 Nota: %{note}",
            ai_analysis: "💭 %{analysis}",
            resolved: "✓ Resuelto: %{products}",
            metrics: {
                actions: "Acciones",
                products: "Productos",
                modifiers_ai: "Modificadores IA",
                auto_added: "Auto-agregados",
            },
        },
        examples: {
            title: "Ejemplos de comandos",
            add_two_burgers: "Agrega dos hamburguesas con queso",
            large_coffee: "Quiero un café grande para llevar",
            remove_pizza: "Quita la pizza de la orden",
            change_quantity: "Cambia la cantidad de tacos a tres",
            add_note: "Agrega nota: sin cebolla en el burrito",
            remove_second: "Quita el segundo ramen",
            modify_quantity: "Cambia el lomo a cantidad 1",
            add_note_no_spicy: "Agrega nota sin picante al ceviche",
        },
        assistant: {
            title: "Asistente de Voz IA",
        },
    },
    category: {
        all: "Todo",
        all_plural: "Todos",
    },
    payment: {
        default: "★",
    },
    tabs: {
        mall_notifications: {
            // Status titles
            order_in_preparation: 'Orden en preparación',
            order_ready: '¡Orden lista!',
            order_ready_pickup: 'Lista para retiro',
            order_completed: 'Orden completada',
            order_cancelled: 'Orden cancelada',
            order_confirmed: 'Orden confirmada',
            order_status_updated: ':store actualizó tu orden a :status',

            // Status messages
            order_in_preparation_message: ':store está preparando tu orden',
            order_prepared_message: ':store tiene :count ítems listos',
            order_delivered_message: ':store ha entregado tu orden',
            order_status_message: ':store: La orden está ahora :status',

            // Tab creation
            new_order_created: 'Nueva orden creada',
            new_order_at_store: 'Nueva orden en :store',
            new_order_message: 'Orden de :customer en mesa :table',
            new_order_message_no_table: 'Orden de :customer',
            new_order_with_items: ':customer en mesa :table ordenó :count ítems',

            // Assistance
            assistance_requested: '¡Asistencia solicitada!',
            assistance_message: ':customer en mesa :table necesita ayuda',
        },
    },
    dash: {
        resource: {
            created: 'Recurso Creado',
            created_message: 'Se ha creado el recurso %{label}',
            updated: 'Recurso Actualizado',
            updated_message: 'Se ha actualizado el recurso %{label}',
            edited: 'Recurso Editado',
            error: 'Error en %{label}',
        },
        action: {
            cancel: 'Cancelar',
            confirm: 'Confirmar',
            continue: 'Continuar',
            edit: 'Editar',
            save: 'Guardar',
            delete: 'Eliminar',
        }
    },
    tenant: {
        tests: {
            title: 'Pruebas del Sistema',
            subtitle: 'Verificar funcionalidades de notificaciones e impresión',
            run: 'Ejecutar',
            running: 'Ejecutando...',
            success: 'Prueba exitosa',
            error: 'Prueba fallida',
            electron_only: 'Solo disponible en la aplicación de escritorio',
            categories: {
                notifications: 'Notificaciones',
                notifications_desc: 'Probar mecanismos de entrega de notificaciones',
                printing: 'Impresión',
                printing_desc: 'Probar funcionalidad de impresión',
            },
            items: {
                fcm_notification: 'Probar Notificación FCM',
                fcm_notification_desc: 'Enviar notificación push a todos los usuarios del tenant con tokens FCM',
                audio_notification: 'Probar Notificación de Audio',
                audio_notification_desc: 'Reproducir la alarma con la configuración guardada',
                tts_notification: 'Probar Notificación TTS',
                tts_notification_desc: 'Probar texto a voz (solo Electron)',
                local_print: 'Impresión Local',
                local_print_desc: 'Imprimir página de prueba directamente vía IPC (solo Electron)',
                network_print: 'Impresión de Red',
                network_print_desc: 'Enviar comando de impresión vía WebSocket al servicio kt_service',
            },
            messages: {
                no_tenant: 'No hay contexto de tenant disponible',
                test_completed: 'Prueba completada exitosamente',
                test_executed: 'Prueba ejecutada exitosamente',
            },
        },
        alarm_settings: {
            title: 'Configuración de Alarma',
            subtitle: 'Configurar sonidos de alarma para notificaciones',
            test_alarm: 'Probar Alarma',
            playing: 'Reproduciendo...',
            reset: 'Restablecer',
            save: 'Guardar Configuración',
            saving: 'Guardando...',
            saved: 'Configuración de alarma guardada',
            save_error: 'Error al guardar configuración',
            test_completed: 'Prueba de alarma completada',
            test_error: 'Error al reproducir alarma',
            create_first: 'La configuración de alarma puede configurarse después de crear el tenant.',
            settings: {
                alarm_duration: 'Duración de Alarma',
                alarm_duration_desc: 'Cuánto tiempo suena la alarma (máximo 10 segundos)',
                high_frequency: 'Frecuencia Alta',
                high_frequency_desc: 'Frecuencia del pitido agudo',
                low_frequency: 'Frecuencia Baja',
                low_frequency_desc: 'Frecuencia del pitido grave',
                beep_duration: 'Duración del Pitido',
                beep_duration_desc: 'Duración de cada pitido',
                beep_gap: 'Espacio entre Pitidos',
                beep_gap_desc: 'Espacio entre pitidos en un patrón',
                pattern_gap: 'Espacio de Patrón',
                pattern_gap_desc: 'Espacio entre patrones de pitidos',
            },
            units: {
                seconds: 's',
                hertz: 'Hz',
                milliseconds: 'ms',
            },
        },
        store_schedule: {
            title: 'Horario de Tienda',
            subtitle: 'Configurar disponibilidad de apertura automática',
            enable_schedule: 'Habilitar Horario Programado',
            enabled: 'Activo',
            disabled: 'Deshabilitado (Modo Manual)',
            disabled_warning: 'El horario está deshabilitado. El estado de la tienda debe gestionarse manualmente en la pestaña Estado.',
            day: 'Día',
            active: 'Activo',
            hours: 'Horas de Apertura',
            add: 'Agregar',
            open: 'Abre',
            close: 'Cierra',
            save_success: 'Horario guardado exitosamente',
            save_error: 'Error al guardar el horario',
            fetch_error: 'Error al cargar el horario',
        },
        store_status: {
            title: 'Estado de Tienda',
            subtitle: 'Estado operativo actual y controles manuales',
            current_status: 'Estado Actual',
            open: 'ABIERTO',
            closed: 'CERRADO',
            open_store: 'Abrir Tienda',
            close_store: 'Cerrar Tienda',
            schedule_active: 'Horario Activo',
            manual_close_warning: 'La tienda está cerrada manualmente. Se abrirá automáticamente en el próximo horario programado.',
            manual_open_warning: 'La tienda está abierta manualmente. Se actualizará según el horario cuando corresponda (ej. al entrar en periodo cerrado).',
            following_schedule: 'La tienda opera según el horario programado (Zona horaria: %{timezone}).',
            manual_mode_info: 'El horario está deshabilitado. Debe abrir y cerrar la tienda manualmente.',
        },
        marketplaces: {
            title: 'Integración con Marketplaces',
            subtitle: 'Conectar y gestionar relaciones con marketplaces',
            nombre: 'Nombre',
            clase: 'Clase',
            select: 'Seleccione',
            select_marketplaces: 'Seleccione marketplaces',
            delete_selected: 'Borrar seleccionados',
        },
        point_of_sales: {
            title: 'Integración de Puntos de Venta',
            subtitle: 'Conectar y gestionar relaciones con puntos de venta',
            nombre: 'Nombre',
            clase: 'Clase',
            select: 'Seleccione',
            select_pos: 'Seleccione puntos de venta',
            delete_selected: 'Borrar seleccionados',
        },
    },
    "dash-auto-admin-tabs": {
        "Productos": "Productos",
        "Actualizaciones": "Actualizaciones",
        "Vouchers": "Vouchers",
        "Datos": "Datos",
    },
    
    // Contenido de la Página de Inicio
    landing: {
        login : {
            title: 'Ingresar',
            email: 'Email',
            password: 'Contraseña',
            submit: 'Ingresar',
            resetPassword: 'Resetear contraseña',
            invalidCredentials: 'Credenciales inválidas',
            invalidEmail: 'Email inválido',
            invalidPassword: 'Contraseña Inválida',
            loading: 'Cargando...',
            alreadyLoggedIn: 'Ya se encuentra logueado',
            goHome: 'Ir al Inicio'
        },
        hero: {
            title: "INAMAP",
            subtitle: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            description: "INAMAP es una plataforma de mapas interactivos para orientar a las personas dentro de recintos: campus, edificios, ferias y eventos, con búsqueda y rutas paso a paso.",
            cta: "Comenzar",
            learnMore: "Conocer Más",
            trialTitle: "¡Únete a INAMAP gratis ahora!",
            trialSubtitle: "Comienza tu periodo de 30 días gratis. No requiere tarjeta de crédito.",
            emailPlaceholder: "Ingresa tu correo electrónico",
            createStore: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto."
        },
        prerelease: {
            title: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            description: "INAMAP está en su fase alfa, y estamos ultimando detalles para ofrecerte la mejor herramienta para tu negocio.",
            callToAction: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            form: {
                name: "Nombre",
                nameRequired: "El nombre es obligatorio",
                email: "Correo electrónico",
                emailRequired: "El correo electrónico es obligatorio",
                emailInvalid: "El correo electrónico no es válido",
                contactPhone: "Teléfono de contacto (opcional)",
                businessWebsite: "Sitio web del negocio (opcional)",
                businessInstagram: "Instagram del negocio (opcional)",
                continue: "Continuar",
                send: "Enviar",
                error: "No pudimos registrar tus datos. Por favor inténtalo nuevamente."
            },
            success: {
                title: "¡Gracias por tu interés! 🎉",
                message: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto."
            }
        },
        what: {
            title: "¿Qué es INAMAP?",
            description: "INAMAP es una plataforma de mapas interactivos para orientar a las personas dentro de recintos: campus, edificios, ferias y eventos, con búsqueda y rutas paso a paso.",
        },
        features: {
            title: "Características Principales",
            subtitle: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            digitalOrders: {
                icon: "📲",
                title: "Digitaliza la toma de pedidos",
                description: "Permite registrar comandas desde dispositivos móviles, reduciendo errores y tiempos de atención."
            },
            optimizeKitchen: {
                icon: "🍳",
                title: "Optimiza la operación en cocina",
                description: "La cocina recibe pedidos claros, ordenados y en tiempo real, con estados visuales y tiempos de preparación."
            },
            syncTeam: {
                icon: "🔄",
                title: "Sincroniza a todo el equipo",
                description: "Meseros, cocina y administración trabajan sobre la misma información, sin duplicaciones ni confusiones."
            },
            independence: {
                icon: "🧩",
                title: "Respeta la independencia de cada local",
                description: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto."
            },
            unifiedExperience: {
                icon: "🏬",
                title: "Habilita una experiencia unificada en el patio",
                description: "Los clientes pueden, en etapas posteriores, pedir desde su celular a distintos locales en un solo flujo."
            },
            visibility: {
                icon: "📊",
                title: "Entrega visibilidad y control",
                description: "Permite ver pedidos activos, tiempos de preparación y estado de las órdenes en tiempo real."
            },
            onlineSales: {
                icon: "🌐",
                title: "Prepara el camino para la venta online",
                description: "Facilita la futura venta digital y la gestión centralizada de despachos para todo el patio."
            },
            scalable: {
                icon: "🚀",
                title: "Escala con el crecimiento del patio",
                description: "La plataforma incorpora progresivamente nuevas funcionalidades como pagos digitales, integración con marketplaces, control de inventarios y logística."
            }
        },
        videoPromo: {
            title: "Video introductorio"
        },
        vision: {
            title: "Nuestra Visión",
            subtitle: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            description: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            goals: {
                title: "Estamos construyendo hacia un futuro donde:",
                items: [
                    "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
                    "Los pedidos, pagos, inventario y despacho fluyen sin fricción",
                    "La inteligencia del sistema mejora aprendiendo de millones de cocinas simultáneamente",
                    "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto."
                ]
            },
            statement: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto."
        },
        benefits: {
            title: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            fasterProcessing: {
                icon: "🚀",
                title: "Procesamiento más Rápido",
                description: "La interfaz simplificada reduce el tiempo de preparación"
            },
            improvedCommunication: {
                icon: "📱",
                title: "Comunicación Mejorada",
                description: "Actualizaciones en tiempo real entre el salón y la cocina"
            },
            reducedErrors: {
                icon: "🎯",
                title: "Reducción de Errores",
                description: "Las pantallas visuales de productos minimizan los errores"
            },
            betterTiming: {
                icon: "⏱️",
                title: "Mejor Sincronización",
                description: "Los temporizadores integrados ayudan a mantener estándares de servicio consistentes"
            },
            insights: {
                icon: "📊",
                title: "Información de Rendimiento",
                description: "Datos sobre tiempos de preparación y cuellos de botella"
            },
            coordination: {
                icon: "👥",
                title: "Coordinación del Equipo",
                description: "El acceso basado en roles asegura una gestión adecuada del flujo de trabajo"
            }
        },
        dashboard: {
            title: "Panel de Control Centralizado",
            description: "INAMAP es una plataforma de mapas interactivos para orientar a las personas dentro de recintos: campus, edificios, ferias y eventos, con búsqueda y rutas paso a paso.",
            features: {
                realtime: "📋 Visualizar órdenes activas y completadas en tiempo real",
                statusChange: "🔄 Cambiar el estado de las órdenes a lo largo del flujo operativo",
                payments: "💳 Gestionar pagos y cierres de cuenta desde un mismo sistema",
                closings: "🧾 Registrar cierres operativos de forma ordenada y trazable"
            },
            sync: "Cada acción se sincroniza instantáneamente con el resto del equipo gracias a un sistema de notificaciones en tiempo real, asegurando que cocina, caja y atención al cliente estén siempre alineados."
        },
        future: {
            title: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            description: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto."
        },
        contact: {
            title: "Contáctanos",
            description: "Es muy fácil ponerse en contacto con nosotros. Solo usa el formulario de contacto o envíanos un correo electrónico.",
            formTitle: "Contáctanos rápidamente",
            name: "Ingresa tu nombre",
            email: "Ingresa tu correo",
            phone: "Tu Teléfono",
            company: "Tu Empresa",
            message: "Mensaje",
            submit: "Enviar Mensaje",
            office: "Oficina Principal",
            contactEmail: "Correo"
        },
        newsletter: {
            placeholder: "Ingresa tu correo",
            subscribe: "Suscribirse",
            title: "Mantente Actualizado",
            description: "Suscríbete a nuestro boletín para recibir las últimas actualizaciones"
        },
        cta: {
            title: "¡Comienza tu camino con nosotros!",
            subtitle: "Comienza tu periodo de 30 días gratis. No requiere tarjeta de crédito."
        },
        footer: {
            description: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            contact: "Contacto",
            terms: "Términos",
            security: "Seguridad",
            privacy: "Privacidad",
            copyright: "© INAMAP, Todos los derechos reservados"
        },
        download: {
            title: "Descarga INAMAP",
            subtitle: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            what_is_title: "¿Qué es INAMAP?",
            what_is_description: "INAMAP es una plataforma de mapas interactivos para orientar a las personas dentro de recintos: campus, edificios, ferias y eventos, con búsqueda y rutas paso a paso.",
            download_title: "Descarga la Aplicación",
            download_subtitle: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            admin_panel_text: "¿Ya tienes una cuenta? Accede al panel de administración",
            admin_panel_button: "Acceder al Panel de Admin",
            features: {
                digitize: {
                    title: "Digitaliza la Toma de Pedidos",
                    description: "Registra comandas desde dispositivos móviles, reduciendo errores y tiempos de atención."
                },
                kitchen: {
                    title: "Optimiza la Operación en Cocina",
                    description: "La cocina recibe pedidos claros, ordenados y en tiempo real, con estados visuales y tiempos de preparación."
                },
                sync: {
                    title: "Sincroniza a Todo el Equipo",
                    description: "Meseros, cocina y administración trabajan sobre la misma información, sin duplicaciones."
                },
                independence: {
                    title: "Independencia de Cada Local",
                    description: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto."
                },
                visibility: {
                    title: "Visibilidad y Control",
                    description: "Visualiza pedidos activos, tiempos de preparación y estado de las órdenes en tiempo real."
                },
                scale: {
                    title: "Escala con el Crecimiento",
                    description: "Incorpora progresivamente pagos digitales, integración con marketplaces, control de inventarios y logística."
                }
            }
        }
    },
    signup: {
        title: "Crea Tu Cuenta",
        accountInformation: "Información de la Cuenta",

        // Pre-release invitation gate
        invitation: {
            title: "Acceso con invitación",
            description: "INAMAP es una plataforma de mapas interactivos para orientar a las personas dentro de recintos: campus, edificios, ferias y eventos, con búsqueda y rutas paso a paso.",
            codeLabel: "Código de invitación",
            submit: "Continuar",
            invalidCode: "El código de invitación no es válido.",
            back: "Volver al inicio"
        },
        
        // Form fields
        email: "Correo Electrónico",
        businessName: "Nombre de la Empresa",
        firstName: "Nombre",
        lastName: "Apellido",
        password: "Contraseña",
        confirmPassword: "Confirmar Contraseña",
        contactPhone: "Teléfono de Contacto",
        rut: "RUT",
        preferredLanguage: "Idioma Preferido",
        preferredCurrency: "Moneda Preferida",
        preferredTimezone: "Zona Horaria",
        
        // Buttons and actions
        continueWithGoogle: "Continuar con Google",
        connecting: "Conectando...",
        createAccountStartTrial: "Crear Cuenta e Iniciar Prueba",
        creatingAccount: "Creando Cuenta...",
        cancel: "Cancelar",
        
        // Messages
        orSignUpWithEmail: "o regístrate con correo electrónico",
        termsOfService: "Términos de Servicio",
        privacyPolicy: "Política de Privacidad",
        byCreatingAccount: "Al crear una cuenta, aceptas nuestros",
        and: "y",
        
        // Validation messages
        emailRequired: "El correo electrónico es obligatorio",
        invalidEmail: "Dirección de correo electrónico inválida",
        businessNameRequired: "El nombre de la empresa es obligatorio",
        rutRequired: "El RUT es obligatorio",
         publicIdLabel: "RUT Empresa",
        invalidRut: "RUT inválido",
        firstNameRequired: "El nombre es obligatorio",
        lastNameRequired: "El apellido es obligatorio",
        passwordRequired: "La contraseña es obligatoria",
        passwordMinLength: "La contraseña debe tener al menos 8 caracteres",
        confirmPasswordRequired: "Por favor confirma tu contraseña",
        passwordsDoNotMatch: "Las contraseñas no coinciden",
        phoneRequired: "El número de teléfono es obligatorio",
        
        // Success and error messages
        accountCreatedSuccess: "¡Bienvenido! Te has suscrito al periodo de prueba de 30 días de INAMAP. Por favor revisa tu correo electrónico para verificar tu cuenta.",
        errorOccurred: "Ocurrió un error, por favor intenta de nuevo",
        registrationError: "Ocurrió un error durante el registro",
        googleSignupDisabled: "El registro con Google está actualmente deshabilitado",
        googleAuthError: "Error con la autenticación de Google",
        
        // Dialog titles
        error: "Error",
        
        success: {
            title: "¡Cuenta Creada Exitosamente!",
            welcome: "¡Bienvenido! Tu cuenta ha sido creada.",
            verificationSent: "Hemos enviado un correo de verificación a %{email}. Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.",
            noVerificationNeeded: "Tu cuenta se está configurando y estará lista en unos momentos. No se requiere verificación por correo: podrás iniciar sesión cuando termine la configuración.",
            description: "Ahora puedes iniciar sesión en tu cuenta y comenzar a usar todas las funciones incluidas en tu plan.",
            loginButton: "Ir a Iniciar Sesión",
            homeButton: "Volver al Inicio",
            home_button:"Volver al Inicio"
        },
        
        verify: {
            title: "Verificación de Cuenta",
            verifying: "Verificando cuenta...",
            invalidLink: "Link de verificación inválido.",
            success: "Cuenta verificada correctamente. Redirigiendo al login...",
            alreadyVerified: "Cuenta ya verificada. Redirigiendo al login...",
            error: "Error al verificar la cuenta. Por favor, intente nuevamente.",
            redirecting: "Redirigiendo al login..."
        },
        
        login: {
            title: "Ingresar",
            email: "Email",
            password: "Contraseña",
            submit: "Ingresar",
            resetPassword: "Resetear contraseña",
            invalidCredentials: "Credenciales inválidas",
            invalidEmail: "Email inválido",
            invalidPassword: "Contraseña Inválida",
            loading: "Cargando...",
            alreadyLoggedIn: "Ya se encuentra logueado",
            goHome: "Ir al Inicio"
        }
    },

    // Menu Items
    menu: {
        home: "Inicio",
        plans: "Planes",
        about: "Acerca de",
        contact: "Contacto",
        download: "Descargar",
        features: "Características"
    },

    // Plans Page
    plans: {
        title: "Elige Tu Plan",
        subtitle: "Comienza tu prueba gratuita hoy. No se requiere tarjeta de crédito.",
        getStarted: "Comenzar",
        footer: "Todos los planes incluyen un período de prueba gratuito. Cancela en cualquier momento.",
        loading: "Cargando planes...",
        error: "Error al cargar los planes de suscripción. Por favor intenta de nuevo más tarde.",
        noPlans: "No hay planes disponibles en este momento.",
        popular: "Más Popular",
        selected: "Seleccionado",
        trialDays: "%{days} días de prueba gratis",
        
        // Plan names by slug
        planNames: {
            "free-trial": "Prueba Gratis",
            "basic-plan": "Plan Básico",
            "professional-plan": "Plan Profesional",
            "enterprise-plan": "Plan Empresarial"
        },
        
        // Plan descriptions by slug
        planDescriptions: {
            "free-trial": "Prueba gratuita de 30 días con funciones básicas",
            "basic-plan": "Perfecto para individuos y equipos pequeños",
            "professional-plan": "Funciones avanzadas para negocios en crecimiento",
            "enterprise-plan": "Solución completa para grandes organizaciones"
        },
        
        // Feature translations
        features: {
            basic_features: "Funciones básicas",
            email_support: "Soporte por email",
            one_store: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            three_users: "3 usuarios",
            fifty_products: "50 productos",
            unlimited_stores: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
            unlimited_users: "Usuarios ilimitados",
            unlimited_products: "Productos ilimitados",
            priority_support: "Soporte prioritario",
            advanced_analytics: "Análisis avanzados",
            custom_domain: "Dominio personalizado",
            api_access: "Acceso a API",
            white_label: "Marca blanca"
        },
        
        // Billing cycles
        billingCycle: {
            daily: "por día",
            weekly: "por semana",
            monthly: "por mes",
            yearly: "por año",
            daily_short: "/día",
            weekly_short: "/sem",
            monthly_short: "/mes",
            yearly_short: "/año"
        },
    },

    // Gestión de Cuenta de Tenancy
    tenancy_account: {
        management: {
            title: "Gestión de Cuenta",
            delete: {
                title: "Eliminar Cuenta",
                description: "Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.",
                button: "Eliminar Cuenta",
                dialog: {
                    title: "Eliminar Cuenta",
                    warning_title: "Advertencia: Esta acción es irreversible",
                    warning_content: "Eliminar tu cuenta:",
                    warning_items: {
                        disable: "Deshabilitará tu cuenta inmediatamente",
                        schedule: "Programará la eliminación permanente después de %{days} días",
                        delete_users: "Eliminará todos los usuarios asociados a esta cuenta",
                        delete_tenants: "Mapas interactivos con búsqueda y rutas para orientar a las personas en tu recinto.",
                        delete_products: "Eliminará todos los productos e inventario",
                        delete_subscriptions: "Cancelará todas las suscripciones activas",
                        delete_data: "Borrará permanentemente todos tus datos"
                    },
                    confirm_instruction: "Escribe ELIMINAR para confirmar:",
                    confirm_word: "ELIMINAR",
                    cancel: "Cancelar",
                    confirm: "Eliminar Mi Cuenta"
                },
                success: "Eliminación de cuenta iniciada. Recibirás un correo de confirmación.",
                error: "Error al iniciar la eliminación de cuenta. Por favor intenta de nuevo.",
                cannot_delete: "No se puede eliminar la cuenta en este momento. Por favor contacta a soporte."
            },
            pending_deletion: {
                title: "Cuenta Pendiente de Eliminación",
                description: "Tu cuenta está programada para eliminación permanente el %{date}.",
                cancel_button: "Cancelar Eliminación",
                cancel_success: "La eliminación de la cuenta ha sido cancelada.",
                cancel_error: "Error al cancelar la eliminación. Por favor intenta de nuevo."
            },
            export: {
                title: "Exportar Tus Datos",
                description: "Descarga una copia de todos los datos de tu cuenta en un formato portable.",
                button: "Solicitar Exportación de Datos",
                requesting: "Solicitando exportación...",
                success: "Exportación de datos solicitada. Recibirás un correo cuando esté lista.",
                error: "Error al solicitar la exportación de datos. Por favor intenta de nuevo.",
                history: {
                    title: "Historial de Exportaciones",
                    no_exports: "Sin exportaciones de datos aún.",
                    status: {
                        pending: "Pendiente",
                        processing: "Procesando",
                        completed: "Completado",
                        failed: "Fallido",
                        expired: "Expirado"
                    },
                    download: "Descargar",
                    expires: "Expira: %{date}",
                    expired_message: "Esta exportación ha expirado"
                }
            }
        }
    },

    // Traducciones de lista de cuentas
    account: {
        no_accounts: "Sin cuentas",
        email_label: "Correo electrónico",
        created_label: "Creado",
        updated_label: "Actualizado",
        trial_ends_label: "Prueba termina",
        plan_label: "Plan",
        trial_days_left: "Días de prueba restantes",
        deletion_scheduled: "Cuenta programada para eliminación el %{date}",
        deletion_days_remaining: "Eliminación de cuenta en %{days} días",
    },

    // kt-devices — solo Kiosks (INAMAP no tiene el recurso de Impresoras ni
    // Terminales; kt-kiosk-agent es el único terminal de borde que tiene, y
    // no reporta hardware propio — ver el register() de device_agent.py, que
    // siempre envía devices: []).
    devices: {
        kiosk: {
            label: "Kioscos",
            menu_list: "Kioscos",
        },
        tabs: {
            general: "General",
            hardware: "Hardware",
            sessions: "Sesiones",
            tail: "Registro en vivo",
        },
        fields: {
            terminal_name: "Kiosco",
            online: "En línea",
            hostname: "Equipo",
            tenant: "Empresa",
            last_seen_at: "Última conexión",
            last_login_at: "Último registro",
            agent_uid: "ID de agente",
            platform: "Plataforma",
            arch: "Arquitectura",
            agent_version: "Versión del agente",
            last_auth_user: "Última sesión iniciada por",
            metadata: "Metadatos",
        },
        tail: {
            title: "Registro en vivo (últimos ~30s de actividad)",
            error: "No se pudo contactar al kiosco en este momento.",
            waiting: "Esperando actividad…",
        },
        filters: {
            search: "Buscar",
        },
    },

};

export default customEs;
