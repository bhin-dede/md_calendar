use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn sanitize_filename(title: &str) -> String {
    let sanitized: String = title
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0' | ' ' => '_',
            _ => c,
        })
        .collect();

    let trimmed = sanitized.trim_matches('_');
    let mut result = String::new();
    let mut prev_underscore = false;

    for c in trimmed.chars() {
        if c == '_' {
            if !prev_underscore {
                result.push(c);
            }
            prev_underscore = true;
        } else {
            result.push(c);
            prev_underscore = false;
        }
    }

    if result.is_empty() {
        return "Untitled".to_string();
    }

    if result.len() > 100 {
        result.truncate(100);
        result = result.trim_end_matches('_').to_string();
    }

    result
}

fn generate_unique_filename(docs_dir: &PathBuf, base_name: &str) -> String {
    let md_path = docs_dir.join(format!("{}.md", base_name));

    if !md_path.exists() {
        return base_name.to_string();
    }

    let mut counter = 1;
    loop {
        let candidate = format!("{}_{}", base_name, counter);
        let candidate_path = docs_dir.join(format!("{}.md", candidate));
        if !candidate_path.exists() {
            return candidate;
        }
        counter += 1;
        if counter > 1000 {
            let now = chrono::Utc::now().timestamp_millis();
            return format!("{}_{}", base_name, now);
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub content: String,
    pub date: i64,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentMeta {
    pub title: String,
    pub date: i64,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentSummary {
    pub id: String,
    pub title: String,
    pub date: i64,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

fn default_status() -> String {
    "none".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AppConfig {
    #[serde(rename = "documentsFolder")]
    pub documents_folder: Option<String>,
}

fn get_config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    Ok(app_data_dir.join("config.json"))
}

fn load_config(app: &tauri::AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_path(app)?;
    if config_path.exists() {
        let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        Ok(AppConfig::default())
    }
}

fn save_config(app: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path(app)?;
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&config_path, content).map_err(|e| e.to_string())
}

fn get_documents_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config = load_config(app)?;

    let docs_dir = if let Some(folder) = config.documents_folder {
        PathBuf::from(folder)
    } else {
        let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        app_data_dir.join("documents")
    };

    if !docs_dir.exists() {
        fs::create_dir_all(&docs_dir).map_err(|e| e.to_string())?;
    }
    Ok(docs_dir)
}

fn get_document_path(app: &tauri::AppHandle, id: &str) -> Result<PathBuf, String> {
    let docs_dir = get_documents_dir(app)?;
    Ok(docs_dir.join(format!("{}.md", id)))
}

fn get_meta_path(app: &tauri::AppHandle, id: &str) -> Result<PathBuf, String> {
    let docs_dir = get_documents_dir(app)?;
    Ok(docs_dir.join(format!("{}.meta.json", id)))
}

#[tauri::command]
fn get_documents_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let config = load_config(&app)?;
    Ok(config.documents_folder)
}

#[tauri::command]
fn set_documents_folder(app: tauri::AppHandle, folder: String) -> Result<(), String> {
    let path = PathBuf::from(&folder);
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }

    let mut config = load_config(&app)?;
    config.documents_folder = Some(folder);
    save_config(&app, &config)
}

#[tauri::command]
fn create_document(
    app: tauri::AppHandle,
    title: String,
    content: String,
    date: i64,
    status: Option<String>,
) -> Result<Document, String> {
    let now = chrono::Utc::now().timestamp_millis();
    let docs_dir = get_documents_dir(&app)?;
    let doc_status = status.unwrap_or_else(|| "none".to_string());

    let base_name = sanitize_filename(&title);
    let id = generate_unique_filename(&docs_dir, &base_name);

    let doc = Document {
        id: id.clone(),
        title: title.clone(),
        content: content.clone(),
        date,
        status: doc_status.clone(),
        created_at: now,
        updated_at: now,
    };

    let doc_path = get_document_path(&app, &id)?;
    let meta_path = get_meta_path(&app, &id)?;

    fs::write(&doc_path, &content).map_err(|e| e.to_string())?;

    let meta = DocumentMeta {
        title,
        date,
        status: doc_status,
        created_at: now,
        updated_at: now,
    };
    let meta_json = serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;
    fs::write(&meta_path, meta_json).map_err(|e| e.to_string())?;

    Ok(doc)
}

#[tauri::command]
fn get_document(app: tauri::AppHandle, id: String) -> Result<Option<Document>, String> {
    let doc_path = get_document_path(&app, &id)?;
    let meta_path = get_meta_path(&app, &id)?;

    if !doc_path.exists() || !meta_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&doc_path).map_err(|e| e.to_string())?;
    let meta_json = fs::read_to_string(&meta_path).map_err(|e| e.to_string())?;
    let meta: DocumentMeta = serde_json::from_str(&meta_json).map_err(|e| e.to_string())?;

    Ok(Some(Document {
        id,
        title: meta.title,
        content,
        date: meta.date,
        status: meta.status,
        created_at: meta.created_at,
        updated_at: meta.updated_at,
    }))
}

#[tauri::command]
fn update_document(
    app: tauri::AppHandle,
    id: String,
    title: Option<String>,
    content: Option<String>,
    date: Option<i64>,
    status: Option<String>,
) -> Result<Document, String> {
    let doc_path = get_document_path(&app, &id)?;
    let meta_path = get_meta_path(&app, &id)?;

    if !doc_path.exists() || !meta_path.exists() {
        return Err("Document not found".to_string());
    }

    let current_content = fs::read_to_string(&doc_path).map_err(|e| e.to_string())?;
    let meta_json = fs::read_to_string(&meta_path).map_err(|e| e.to_string())?;
    let mut meta: DocumentMeta = serde_json::from_str(&meta_json).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().timestamp_millis();
    let new_content = content.unwrap_or(current_content);

    let title_changed = title.as_ref().map_or(false, |t| t != &meta.title);
    let new_title = title.unwrap_or_else(|| meta.title.clone());

    if let Some(d) = date {
        meta.date = d;
    }
    if let Some(s) = status {
        meta.status = s;
    }
    meta.title = new_title.clone();
    meta.updated_at = now;

    let new_id = if title_changed {
        let docs_dir = get_documents_dir(&app)?;
        let base_name = sanitize_filename(&new_title);

        if base_name != id {
            let new_id = generate_unique_filename(&docs_dir, &base_name);
            let new_doc_path = docs_dir.join(format!("{}.md", new_id));
            let new_meta_path = docs_dir.join(format!("{}.meta.json", new_id));

            fs::write(&new_doc_path, &new_content).map_err(|e| e.to_string())?;
            let meta_json = serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;
            fs::write(&new_meta_path, meta_json).map_err(|e| e.to_string())?;

            fs::remove_file(&doc_path).ok();
            fs::remove_file(&meta_path).ok();

            new_id
        } else {
            fs::write(&doc_path, &new_content).map_err(|e| e.to_string())?;
            let meta_json = serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;
            fs::write(&meta_path, meta_json).map_err(|e| e.to_string())?;
            id
        }
    } else {
        fs::write(&doc_path, &new_content).map_err(|e| e.to_string())?;
        let meta_json = serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;
        fs::write(&meta_path, meta_json).map_err(|e| e.to_string())?;
        id
    };

    Ok(Document {
        id: new_id,
        title: meta.title,
        content: new_content,
        date: meta.date,
        status: meta.status,
        created_at: meta.created_at,
        updated_at: meta.updated_at,
    })
}

#[tauri::command]
fn delete_document(app: tauri::AppHandle, id: String) -> Result<bool, String> {
    let doc_path = get_document_path(&app, &id)?;
    let meta_path = get_meta_path(&app, &id)?;

    if doc_path.exists() {
        fs::remove_file(&doc_path).map_err(|e| e.to_string())?;
    }
    if meta_path.exists() {
        fs::remove_file(&meta_path).map_err(|e| e.to_string())?;
    }

    Ok(true)
}

#[tauri::command]
fn get_all_documents(app: tauri::AppHandle) -> Result<Vec<Document>, String> {
    let docs_dir = get_documents_dir(&app)?;
    let mut documents = Vec::new();

    let entries = fs::read_dir(&docs_dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "md") {
            let id = path
                .file_stem()
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .ok_or("Invalid filename")?;

            if let Ok(Some(doc)) = get_document(app.clone(), id) {
                documents.push(doc);
            }
        }
    }

    documents.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(documents)
}

#[tauri::command]
fn get_all_document_summaries(app: tauri::AppHandle) -> Result<Vec<DocumentSummary>, String> {
    let docs_dir = get_documents_dir(&app)?;
    let mut summaries = Vec::new();

    let entries = fs::read_dir(&docs_dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "json")
            && path
                .file_name()
                .map_or(false, |n| n.to_string_lossy().ends_with(".meta.json"))
        {
            let filename = path
                .file_name()
                .and_then(|s| s.to_str())
                .ok_or("Invalid filename")?;
            let id = filename
                .strip_suffix(".meta.json")
                .ok_or("Invalid meta filename")?
                .to_string();

            let meta_json = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(meta) = serde_json::from_str::<DocumentMeta>(&meta_json) {
                summaries.push(DocumentSummary {
                    id,
                    title: meta.title,
                    date: meta.date,
                    status: meta.status,
                    created_at: meta.created_at,
                    updated_at: meta.updated_at,
                });
            }
        }
    }

    summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(summaries)
}

#[tauri::command]
fn get_document_summaries_for_month(
    app: tauri::AppHandle,
    year: i32,
    month: u32,
) -> Result<Vec<DocumentSummary>, String> {
    let all_summaries = get_all_document_summaries(app)?;

    let filtered: Vec<DocumentSummary> = all_summaries
        .into_iter()
        .filter(|doc| {
            let date = chrono::DateTime::from_timestamp_millis(doc.date);
            if let Some(dt) = date {
                let dt = dt.with_timezone(&chrono::Utc);
                dt.format("%Y").to_string().parse::<i32>().unwrap_or(0) == year
                    && dt.format("%m").to_string().parse::<u32>().unwrap_or(0) == month
            } else {
                false
            }
        })
        .collect();

    Ok(filtered)
}

#[tauri::command]
fn get_documents_for_month(
    app: tauri::AppHandle,
    year: i32,
    month: u32,
) -> Result<Vec<Document>, String> {
    let all_docs = get_all_documents(app)?;

    let filtered: Vec<Document> = all_docs
        .into_iter()
        .filter(|doc| {
            let date = chrono::DateTime::from_timestamp_millis(doc.date);
            if let Some(dt) = date {
                let dt = dt.with_timezone(&chrono::Utc);
                dt.format("%Y").to_string().parse::<i32>().unwrap_or(0) == year
                    && dt.format("%m").to_string().parse::<u32>().unwrap_or(0) == month
            } else {
                false
            }
        })
        .collect();

    Ok(filtered)
}

#[tauri::command]
fn search_document_summaries(
    app: tauri::AppHandle,
    query: String,
) -> Result<Vec<DocumentSummary>, String> {
    let all_summaries = get_all_document_summaries(app)?;
    let query_lower = query.to_lowercase();

    let filtered: Vec<DocumentSummary> = all_summaries
        .into_iter()
        .filter(|doc| doc.title.to_lowercase().contains(&query_lower))
        .collect();

    Ok(filtered)
}

#[tauri::command]
fn search_documents(app: tauri::AppHandle, query: String) -> Result<Vec<Document>, String> {
    let all_docs = get_all_documents(app)?;
    let query_lower = query.to_lowercase();

    let filtered: Vec<Document> = all_docs
        .into_iter()
        .filter(|doc| {
            doc.title.to_lowercase().contains(&query_lower)
                || doc.content.to_lowercase().contains(&query_lower)
        })
        .collect();

    Ok(filtered)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let icon_path = app
                    .path()
                    .resource_dir()
                    .ok()
                    .map(|p| p.join("icons/icon.png"));

                if let Some(path) = icon_path {
                    if path.exists() {
                        if let Ok(bytes) = std::fs::read(&path) {
                            if let Ok(img) = image::load_from_memory(&bytes) {
                                let rgba = img.to_rgba8();
                                let (width, height) = rgba.dimensions();
                                let icon =
                                    tauri::image::Image::new_owned(rgba.into_raw(), width, height);
                                let _ = window.set_icon(icon);
                            }
                        }
                    }
                }
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_document,
            get_document,
            update_document,
            delete_document,
            get_all_documents,
            get_all_document_summaries,
            get_documents_for_month,
            get_document_summaries_for_month,
            search_documents,
            search_document_summaries,
            get_documents_folder,
            set_documents_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
