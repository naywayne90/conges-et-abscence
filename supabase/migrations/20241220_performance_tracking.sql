-- Fonction pour calculer les statistiques par valideur
CREATE OR REPLACE FUNCTION get_validator_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    validator_id UUID,
    validator_name TEXT,
    validator_role TEXT,
    total_requests INTEGER,
    approved_requests INTEGER,
    rejected_requests INTEGER,
    pending_requests INTEGER,
    average_time_hours NUMERIC,
    approval_rate NUMERIC,
    delayed_requests INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH request_stats AS (
        SELECT 
            CASE 
                WHEN lr.type = 'Congé annuel' THEN u.id
                ELSE u2.id
            END AS vid,
            CASE 
                WHEN lr.type = 'Congé annuel' THEN u.name
                ELSE u2.name
            END AS vname,
            CASE 
                WHEN lr.type = 'Congé annuel' THEN u.role
                ELSE u2.role
            END AS vrole,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE lr.status = 'validé') AS approved,
            COUNT(*) FILTER (WHERE lr.status = 'rejeté') AS rejected,
            COUNT(*) FILTER (WHERE lr.status = 'en_attente') AS pending,
            AVG(
                CASE 
                    WHEN lr.status IN ('validé', 'rejeté') 
                    THEN EXTRACT(EPOCH FROM (lr.updated_at - lr.created_at))/3600
                    ELSE NULL 
                END
            ) AS avg_time,
            COUNT(*) FILTER (
                WHERE lr.status = 'en_attente' 
                AND is_request_delayed(lr.start_date, lr.status, lr.last_reminder_at)
            ) AS delayed
        FROM leave_requests lr
        LEFT JOIN users u ON u.role = 'direction'
        LEFT JOIN users u2 ON u2.role = 'dgpec'
        WHERE lr.created_at BETWEEN start_date AND end_date
        GROUP BY vid, vname, vrole
    )
    SELECT 
        rs.vid,
        rs.vname,
        rs.vrole,
        rs.total::INTEGER,
        rs.approved::INTEGER,
        rs.rejected::INTEGER,
        rs.pending::INTEGER,
        ROUND(rs.avg_time::NUMERIC, 2),
        ROUND((rs.approved::NUMERIC / NULLIF(rs.approved + rs.rejected, 0) * 100)::NUMERIC, 2),
        rs.delayed::INTEGER
    FROM request_stats rs
    WHERE rs.vid IS NOT NULL
    ORDER BY rs.total DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques mensuelles
CREATE OR REPLACE FUNCTION get_monthly_stats(
    months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
    month_date DATE,
    role TEXT,
    total_requests INTEGER,
    average_time_hours NUMERIC,
    approval_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE months AS (
        SELECT 
            DATE_TRUNC('month', CURRENT_DATE)::DATE AS month_date
        UNION ALL
        SELECT 
            (month_date - INTERVAL '1 month')::DATE
        FROM months
        WHERE month_date > (CURRENT_DATE - (months_back || ' months')::INTERVAL)::DATE
    )
    SELECT 
        m.month_date,
        CASE 
            WHEN lr.type = 'Congé annuel' THEN 'direction'
            ELSE 'dgpec'
        END AS role,
        COUNT(lr.id)::INTEGER AS total_requests,
        ROUND(AVG(
            CASE 
                WHEN lr.status IN ('validé', 'rejeté') 
                THEN EXTRACT(EPOCH FROM (lr.updated_at - lr.created_at))/3600
                ELSE NULL 
            END
        )::NUMERIC, 2) AS average_time_hours,
        ROUND((
            COUNT(*) FILTER (WHERE lr.status = 'validé')::NUMERIC / 
            NULLIF(COUNT(*) FILTER (WHERE lr.status IN ('validé', 'rejeté')), 0) * 100
        )::NUMERIC, 2) AS approval_rate
    FROM months m
    LEFT JOIN leave_requests lr ON 
        DATE_TRUNC('month', lr.created_at)::DATE = m.month_date
    GROUP BY m.month_date, role
    ORDER BY m.month_date DESC, role;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques par type de demande
CREATE OR REPLACE FUNCTION get_request_type_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    request_type TEXT,
    total_requests INTEGER,
    average_time_hours NUMERIC,
    approval_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.type AS request_type,
        COUNT(*)::INTEGER AS total_requests,
        ROUND(AVG(
            CASE 
                WHEN lr.status IN ('validé', 'rejeté') 
                THEN EXTRACT(EPOCH FROM (lr.updated_at - lr.created_at))/3600
                ELSE NULL 
            END
        )::NUMERIC, 2) AS average_time_hours,
        ROUND((
            COUNT(*) FILTER (WHERE lr.status = 'validé')::NUMERIC / 
            NULLIF(COUNT(*) FILTER (WHERE lr.status IN ('validé', 'rejeté')), 0) * 100
        )::NUMERIC, 2) AS approval_rate
    FROM leave_requests lr
    WHERE lr.created_at BETWEEN start_date AND end_date
    GROUP BY lr.type
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;
