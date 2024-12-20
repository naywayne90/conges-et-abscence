-- Fonction pour obtenir les statistiques globales DG
CREATE OR REPLACE FUNCTION get_dg_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_requests INTEGER,
    approved_requests INTEGER,
    rejected_requests INTEGER,
    pending_requests INTEGER,
    average_processing_time_hours NUMERIC,
    approval_rate NUMERIC,
    rejection_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) FILTER (WHERE status IN ('validée_finale', 'rejetée_finale', 'validée_par_dgpec')) as total,
            COUNT(*) FILTER (WHERE status = 'validée_finale') as approved,
            COUNT(*) FILTER (WHERE status = 'rejetée_finale') as rejected,
            COUNT(*) FILTER (WHERE status = 'validée_par_dgpec') as pending,
            AVG(
                EXTRACT(EPOCH FROM (
                    COALESCE(
                        (
                            SELECT al.created_at
                            FROM action_logs al
                            WHERE al.request_id = lr.id
                            AND al.action IN ('validation_finale', 'rejet_final')
                            ORDER BY al.created_at DESC
                            LIMIT 1
                        ),
                        CURRENT_TIMESTAMP
                    ) - 
                    (
                        SELECT al.created_at
                        FROM action_logs al
                        WHERE al.request_id = lr.id
                        AND al.action = 'validation_dgpec'
                        ORDER BY al.created_at DESC
                        LIMIT 1
                    )
                )) / 3600
            ) FILTER (WHERE status IN ('validée_finale', 'rejetée_finale')) as avg_processing_time
        FROM leave_requests lr
        WHERE (start_date IS NULL OR lr.created_at >= start_date)
        AND (end_date IS NULL OR lr.created_at <= end_date)
    )
    SELECT
        total::INTEGER as total_requests,
        approved::INTEGER as approved_requests,
        rejected::INTEGER as rejected_requests,
        pending::INTEGER as pending_requests,
        ROUND(avg_processing_time::NUMERIC, 2) as average_processing_time_hours,
        ROUND((approved::NUMERIC / NULLIF(total, 0) * 100)::NUMERIC, 2) as approval_rate,
        ROUND((rejected::NUMERIC / NULLIF(total, 0) * 100)::NUMERIC, 2) as rejection_rate
    FROM stats;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques mensuelles
CREATE OR REPLACE FUNCTION get_dg_monthly_stats(
    year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
    month INTEGER,
    total_requests INTEGER,
    approved_requests INTEGER,
    rejected_requests INTEGER,
    average_processing_time_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_stats AS (
        SELECT
            EXTRACT(MONTH FROM lr.created_at)::INTEGER as month,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'validée_finale') as approved,
            COUNT(*) FILTER (WHERE status = 'rejetée_finale') as rejected,
            AVG(
                EXTRACT(EPOCH FROM (
                    COALESCE(
                        (
                            SELECT al.created_at
                            FROM action_logs al
                            WHERE al.request_id = lr.id
                            AND al.action IN ('validation_finale', 'rejet_final')
                            ORDER BY al.created_at DESC
                            LIMIT 1
                        ),
                        CURRENT_TIMESTAMP
                    ) - 
                    (
                        SELECT al.created_at
                        FROM action_logs al
                        WHERE al.request_id = lr.id
                        AND al.action = 'validation_dgpec'
                        ORDER BY al.created_at DESC
                        LIMIT 1
                    )
                )) / 3600
            ) FILTER (WHERE status IN ('validée_finale', 'rejetée_finale')) as avg_processing_time
        FROM leave_requests lr
        WHERE EXTRACT(YEAR FROM lr.created_at) = year
        GROUP BY month
    )
    SELECT
        month,
        total::INTEGER as total_requests,
        approved::INTEGER as approved_requests,
        rejected::INTEGER as rejected_requests,
        ROUND(avg_processing_time::NUMERIC, 2) as average_processing_time_hours
    FROM monthly_stats
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;
